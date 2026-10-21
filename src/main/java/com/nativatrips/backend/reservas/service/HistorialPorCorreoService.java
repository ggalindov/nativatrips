package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.dto.ReservaDelHistorialResponse;
import com.nativatrips.backend.reservas.model.EnlaceHistorial;
import com.nativatrips.backend.reservas.repository.EnlaceHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-36 sin cuentas de turista: quien reservo pide con su correo un enlace que abre, durante 24
 * horas, todas las reservas hechas con ese correo. La respuesta a la solicitud es siempre la misma,
 * exista o no el correo, para no revelar quien ha reservado.
 */
@Service
public class HistorialPorCorreoService {

    static final Duration VIGENCIA = Duration.ofHours(24);
    public static final String ENLACE_INVALIDO = "ENLACE_INVALIDO";

    private final EnlaceHistorialRepository enlaceRepository;
    private final ReservaRepository reservaRepository;
    private final SenderoRepository senderoRepository;
    private final NotificacionService notificacionService;
    private final Clock reloj;
    private final String urlFrontend;

    public HistorialPorCorreoService(
            EnlaceHistorialRepository enlaceRepository,
            ReservaRepository reservaRepository,
            SenderoRepository senderoRepository,
            NotificacionService notificacionService,
            Clock reloj,
            @Value("${app.frontend-url:http://localhost:3000}") String urlFrontend) {
        this.enlaceRepository = enlaceRepository;
        this.reservaRepository = reservaRepository;
        this.senderoRepository = senderoRepository;
        this.notificacionService = notificacionService;
        this.reloj = reloj;
        this.urlFrontend = urlFrontend.endsWith("/") ? urlFrontend.substring(0, urlFrontend.length() - 1) : urlFrontend;
    }

    @Transactional
    public void solicitar(String correoCrudo) {
        String correo = correoCrudo.trim().toLowerCase(Locale.ROOT);
        if (!reservaRepository.existsByTitularCorreo(correo)) {
            return;
        }
        String token = TokenSeguro.generar();
        Instant ahora = reloj.instant();
        enlaceRepository.save(new EnlaceHistorial(correo, TokenSeguro.hash(token), ahora.plus(VIGENCIA), ahora));
        notificacionService.enviarCorreo(
                correo,
                "Tus reservas en NativaTrips",
                "Hola. Pediste ver las reservas hechas con este correo. Este enlace sirve durante 24 horas:"
                        + "\n\n" + urlFrontend + "/mis-reservas/" + token
                        + "\n\nSi no lo pediste, ignora este correo: nadie más puede abrirlo.");
    }

    @Transactional(readOnly = true)
    public List<ReservaDelHistorialResponse> consultar(String token) {
        EnlaceHistorial enlace = token == null || token.isBlank()
                ? null
                : enlaceRepository.findByTokenHash(TokenSeguro.hash(token.trim())).orElse(null);
        if (enlace == null || !enlace.estaVigente(reloj.instant())) {
            throw new BusinessRuleException(
                    HttpStatus.NOT_FOUND, "El enlace no es valido o ya vencio. Pide uno nuevo con tu correo",
                    ENLACE_INVALIDO, null);
        }
        Map<Long, String> nombres = senderoRepository.findAll().stream()
                .collect(Collectors.toMap(Sendero::getId, Sendero::getNombre, (a, b) -> a));
        return reservaRepository.findByTitularCorreoOrderByFechaTourDesc(enlace.getCorreo()).stream()
                .map(r -> new ReservaDelHistorialResponse(
                        r.getCodigoReserva(), r.getSenderoId(), nombres.getOrDefault(r.getSenderoId(), ""),
                        r.getFechaTour(), r.getCantidadPersonas(), r.getEstado()))
                .toList();
    }
}
