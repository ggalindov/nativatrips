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
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtProperties jwtProperties) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtProperties = jwtProperties;
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

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BusinessRuleException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!usuario.isActivo()) {
            throw new BusinessRuleException(HttpStatus.FORBIDDEN, "La cuenta esta inactiva");
        }

        String token = jwtTokenProvider.generarToken(usuario.getId(), usuario.getEmail(), usuario.getRol());
        return LoginResponse.of(token, jwtProperties.getExpirationMinutes(), UsuarioResponse.from(usuario));
    }
}
