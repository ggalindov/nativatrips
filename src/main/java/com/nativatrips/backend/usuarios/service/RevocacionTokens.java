package com.nativatrips.backend.usuarios.service;

import com.nativatrips.backend.usuarios.model.TokenRevocado;
import com.nativatrips.backend.usuarios.repository.TokenRevocadoRepository;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.time.Clock;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cierre de sesion real (BUG-02): el token cerrado deja de servir aunque aun no venza. */
@Service
public class RevocacionTokens {

    private static final Logger log = LoggerFactory.getLogger(RevocacionTokens.class);

    private final TokenRevocadoRepository repositorio;
    private final JwtTokenProvider jwtTokenProvider;
    private final Clock reloj;

    public RevocacionTokens(TokenRevocadoRepository repositorio, JwtTokenProvider jwtTokenProvider, Clock reloj) {
        this.repositorio = repositorio;
        this.jwtTokenProvider = jwtTokenProvider;
        this.reloj = reloj;
    }

    /** Revoca el token si es valido; un token invalido o vencido ya no sirve y se ignora. */
    @Transactional
    public void revocar(String token) {
        Claims claims;
        try {
            claims = jwtTokenProvider.validarYObtenerClaims(token);
        } catch (JwtException | IllegalArgumentException ex) {
            return;
        }
        UUID jti = jwtTokenProvider.obtenerJti(claims);
        if (!repositorio.existsById(jti)) {
            repositorio.save(new TokenRevocado(jti, claims.getExpiration().toInstant(), reloj.instant()));
        }
    }

    @Transactional(readOnly = true)
    public boolean estaRevocado(UUID jti) {
        return repositorio.existsById(jti);
    }

    /** Los tokens ya vencidos no necesitan seguir en la lista: no pasan la validacion de firma. */
    @Scheduled(cron = "0 30 3 * * *", zone = "America/Bogota")
    @Transactional
    public void limpiarVencidos() {
        int borrados = repositorio.borrarVencidosAntesDe(reloj.instant());
        if (borrados > 0) {
            log.info("Se borraron {} tokens revocados ya vencidos", borrados);
        }
    }
}
