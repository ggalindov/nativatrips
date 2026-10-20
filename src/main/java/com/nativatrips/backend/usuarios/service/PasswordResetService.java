package com.nativatrips.backend.usuarios.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.usuarios.model.PasswordResetToken;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.PasswordResetTokenRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-34 y HU-14 criterio 4: la recuperacion llega como enlace con vencimiento. En la base solo
 * queda el hash SHA-256 del token: quien lea la tabla no puede usarlo para cambiar una clave.
 */
@Service
public class PasswordResetService {

    static final long EXPIRACION_MINUTOS = 30;

    private static final DateTimeFormatter HORA =
            DateTimeFormatter.ofPattern("HH:mm").withZone(RelojConfig.ZONA_OPERACION);

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacionService notificacionService;
    private final Clock reloj;
    private final String urlFrontend;

    public PasswordResetService(
            UsuarioRepository usuarioRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            NotificacionService notificacionService,
            Clock reloj,
            @Value("${app.frontend-url:http://localhost:3000}") String urlFrontend) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificacionService = notificacionService;
        this.reloj = reloj;
        this.urlFrontend = urlFrontend.endsWith("/") ? urlFrontend.substring(0, urlFrontend.length() - 1) : urlFrontend;
    }

    /** Nunca revela si el email existe o no. Un enlace nuevo anula los anteriores que sigan vigentes. */
    @Transactional
    public void solicitarRestablecimiento(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            tokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId()).forEach(PasswordResetToken::marcarUsado);

            String token = TokenSeguro.generar();
            Instant expiraEn = reloj.instant().plus(EXPIRACION_MINUTOS, ChronoUnit.MINUTES);
            tokenRepository.save(new PasswordResetToken(usuario.getId(), TokenSeguro.hash(token), expiraEn));

            notificacionService.enviarCorreo(
                    usuario.getEmail(),
                    "Restablecimiento de contrasena - NativaTrips",
                    "Hola " + usuario.getNombreCompleto() + ". Para crear una nueva contrasena abre este enlace."
                            + " Sirve una sola vez y vence en " + EXPIRACION_MINUTOS + " minutos (a las "
                            + HORA.format(expiraEn) + ", hora de Colombia):\n\n"
                            + urlFrontend + "/equipo/recuperar?token=" + token
                            + "\n\nSi no lo pediste, ignora este correo: tu contrasena sigue igual.");
        });
    }

    @Transactional
    public void restablecerPassword(String token, String nuevaPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(TokenSeguro.hash(token))
                .filter(t -> t.estaVigente(reloj.instant()))
                .orElseThrow(() -> new BusinessRuleException(
                        HttpStatus.BAD_REQUEST, "El enlace es invalido, ya fue usado o vencio; pide uno nuevo"));

        Usuario usuario = usuarioRepository.findById(resetToken.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        // Quien recupera la clave por correo ya demostro ser el titular: se levanta el bloqueo (A-04).
        usuario.reiniciarIntentos();
        resetToken.marcarUsado();
        // Sin llamadas a save(): ambas entidades estan gestionadas dentro de la transaccion
        // y JPA hace flush de los cambios (dirty checking) al confirmar.
    }
}
