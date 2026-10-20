package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.reservas.model.AccesoEnlaceReserva;
import com.nativatrips.backend.reservas.model.EnlaceReserva;
import com.nativatrips.backend.reservas.model.PropositoEnlace;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.AccesoEnlaceReservaRepository;
import com.nativatrips.backend.reservas.repository.EnlaceReservaRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import java.time.Clock;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * HU-18 (NAT-112), ADR-004: enlace magico para gestionar una reserva sin cuenta. Sirve hasta que
 * termina el dia del tour; pedir uno nuevo revoca los anteriores y cada uso queda registrado.
 */
@Service
public class EnlaceReservaService {

    public static final String ENLACE_INVALIDO = "ENLACE_INVALIDO";

    private final EnlaceReservaRepository enlaceRepository;
    private final AccesoEnlaceReservaRepository accesoRepository;
    private final ReservaRepository reservaRepository;
    private final Clock reloj;
    private final String urlFrontend;

    public EnlaceReservaService(
            EnlaceReservaRepository enlaceRepository,
            AccesoEnlaceReservaRepository accesoRepository,
            ReservaRepository reservaRepository,
            Clock reloj,
            @Value("${app.frontend-url:http://localhost:3000}") String urlFrontend) {
        this.enlaceRepository = enlaceRepository;
        this.accesoRepository = accesoRepository;
        this.reservaRepository = reservaRepository;
        this.reloj = reloj;
        this.urlFrontend = urlFrontend.endsWith("/") ? urlFrontend.substring(0, urlFrontend.length() - 1) : urlFrontend;
    }

    public record EnlaceEmitido(String url, Instant expiraEn) {
    }

    /** Crea el enlace de la reserva y revoca los que tuviera: solo el ultimo enviado sirve (criterio 3). */
    @Transactional
    public EnlaceEmitido emitir(Reserva reserva) {
        Instant ahora = reloj.instant();
        enlaceRepository
                .findByReservaIdAndPropositoAndRevocadoEnIsNull(reserva.getId(), PropositoEnlace.GESTIONAR_RESERVA)
                .forEach(enlace -> enlace.revocar(ahora));

        String token = TokenSeguro.generar();
        Instant expiraEn = finDelDiaDelTour(reserva);
        enlaceRepository.save(new EnlaceReserva(
                reserva.getId(), TokenSeguro.hash(token), PropositoEnlace.GESTIONAR_RESERVA, expiraEn, ahora));
        return new EnlaceEmitido(urlFrontend + "/mi-reserva/" + token, expiraEn);
    }

    /**
     * Devuelve la reserva del enlace y registra el uso. Un enlace inexistente, revocado o vencido
     * responde lo mismo, sin datos de la reserva (criterio 4).
     */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public Reserva abrir(String token, String accion, String ip) {
        Instant ahora = reloj.instant();
        EnlaceReserva enlace = token == null || token.isBlank()
                ? null
                : enlaceRepository.findByTokenHash(TokenSeguro.hash(token.trim()))
                        .filter(e -> e.getProposito() == PropositoEnlace.GESTIONAR_RESERVA)
                        .orElse(null);
        if (enlace == null || !enlace.estaVigente(ahora)) {
            throw enlaceInvalido();
        }

        accesoRepository.save(new AccesoEnlaceReserva(enlace.getId(), accion, ip, ahora));
        return reservaRepository.findById(enlace.getReservaId()).orElseThrow(EnlaceReservaService::enlaceInvalido);
    }

    private static Instant finDelDiaDelTour(Reserva reserva) {
        return reserva.getFechaTour().plusDays(1).atStartOfDay(RelojConfig.ZONA_OPERACION).toInstant();
    }

    private static BusinessRuleException enlaceInvalido() {
        return new BusinessRuleException(
                HttpStatus.NOT_FOUND,
                "El enlace no es valido o ya vencio. Pide uno nuevo con tu correo y el codigo de la reserva",
                ENLACE_INVALIDO,
                null);
    }
}
