package com.nativatrips.backend.usuarios.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.usuarios.model.PasswordResetToken;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.PasswordResetTokenRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordResetService {

    private static final long EXPIRACION_MINUTOS = 30;

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacionService notificacionService;

    public PasswordResetService(
            UsuarioRepository usuarioRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            NotificacionService notificacionService) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificacionService = notificacionService;
    }

    /** Nunca revela si el email existe o no, para no darle esa informacion a un atacante. */
    @Transactional
    public void solicitarRestablecimiento(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String token = UUID.randomUUID().toString();
            Instant expiraEn = Instant.now().plus(EXPIRACION_MINUTOS, ChronoUnit.MINUTES);
            tokenRepository.save(new PasswordResetToken(usuario.getId(), token, expiraEn));

            notificacionService.enviarCorreo(
                    usuario.getEmail(),
                    "Restablecimiento de contrasena - NativaTrips",
                    "Usa este token para restablecer tu contrasena (valido " + EXPIRACION_MINUTOS
                            + " minutos): " + token);
        });
    }

    @Transactional
    public void restablecerPassword(String token, String nuevaPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .filter(t -> t.estaVigente(Instant.now()))
                .orElseThrow(() -> new BusinessRuleException(
                        HttpStatus.BAD_REQUEST, "El token es invalido, ya fue usado o expiro"));

        Usuario usuario = usuarioRepository.findById(resetToken.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        resetToken.marcarUsado();
        // Sin llamadas a save(): ambas entidades estan gestionadas dentro de la transaccion
        // y JPA hace flush de los cambios (dirty checking) al confirmar.
    }
}
