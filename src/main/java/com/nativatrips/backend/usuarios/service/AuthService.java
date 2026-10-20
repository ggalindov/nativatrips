package com.nativatrips.backend.usuarios.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.usuarios.dto.LoginRequest;
import com.nativatrips.backend.usuarios.dto.LoginResponse;
import com.nativatrips.backend.usuarios.dto.RegistroTuristaRequest;
import com.nativatrips.backend.usuarios.dto.UsuarioResponse;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    /** Mismo mensaje para correo desconocido, clave equivocada y cuenta bloqueada (A-04). */
    static final String CREDENCIALES_INVALIDAS = "Credenciales invalidas o acceso bloqueado temporalmente por intentos fallidos";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final Clock reloj;
    private final int intentosMaximos;
    private final Duration duracionBloqueo;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtProperties jwtProperties,
            Clock reloj,
            @Value("${app.auth.intentos-maximos:5}") int intentosMaximos,
            @Value("${app.auth.minutos-bloqueo:15}") long minutosBloqueo) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtProperties = jwtProperties;
        this.reloj = reloj;
        this.intentosMaximos = intentosMaximos;
        this.duracionBloqueo = Duration.ofMinutes(minutosBloqueo);
    }

    @Transactional
    public UsuarioResponse registrarTurista(RegistroTuristaRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "El email ya esta registrado");
        }

        Usuario usuario = new Usuario(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.nombreCompleto(),
                Rol.TURISTA);
        usuario.setTelefono(request.telefono());
        usuario.setDocumentoIdentidad(request.documentoIdentidad());

        usuario = usuarioRepository.save(usuario);
        return UsuarioResponse.from(usuario);
    }

    /**
     * HU-14 criterio 6: tras cinco intentos fallidos seguidos la cuenta queda bloqueada 15 minutos,
     * aunque luego llegue la clave correcta. El intento fallido se guarda aunque la respuesta sea un error.
     */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailConBloqueo(request.email())
                .orElseThrow(AuthService::credencialesInvalidas);

        Instant ahora = reloj.instant();
        if (usuario.estaBloqueado(ahora)) {
            throw credencialesInvalidas();
        }
        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            usuario.registrarIntentoFallido(ahora, intentosMaximos, duracionBloqueo);
            throw credencialesInvalidas();
        }
        usuario.reiniciarIntentos();

        if (!usuario.isActivo()) {
            throw new BusinessRuleException(HttpStatus.FORBIDDEN, "La cuenta esta inactiva");
        }

        String token = jwtTokenProvider.generarToken(usuario.getId(), usuario.getEmail(), usuario.getRol());
        return LoginResponse.of(token, jwtProperties.getExpirationMinutes(), UsuarioResponse.from(usuario));
    }

    private static BusinessRuleException credencialesInvalidas() {
        return new BusinessRuleException(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
    }
}
