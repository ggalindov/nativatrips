package com.nativatrips.backend.usuarios.controller;

import com.nativatrips.backend.usuarios.dto.LoginRequest;
import com.nativatrips.backend.usuarios.dto.LoginResponse;
import com.nativatrips.backend.usuarios.dto.OlvidePasswordRequest;
import com.nativatrips.backend.usuarios.dto.RegistroTuristaRequest;
import com.nativatrips.backend.usuarios.dto.RestablecerPasswordRequest;
import com.nativatrips.backend.usuarios.dto.UsuarioResponse;
import com.nativatrips.backend.usuarios.service.AuthService;
import com.nativatrips.backend.usuarios.service.PasswordResetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    /** RF-33: registro publico, siempre crea un usuario con rol TURISTA. */
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registro(@Valid @RequestBody RegistroTuristaRequest request) {
        UsuarioResponse response = authService.registrarTurista(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /** RF-32/33: login para cualquier rol, emite JWT. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * RF-33: sin blacklist de tokens en el MVP (JWT stateless) - el cliente descarta el token.
     * El endpoint existe para que el contrato de la API sea explicito y quede listo si mas
     * adelante se agrega revocacion server-side.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    /** RF-34. Respuesta siempre generica: no revela si el email esta registrado. */
    @PostMapping("/olvide-password")
    public ResponseEntity<Void> olvidePassword(@Valid @RequestBody OlvidePasswordRequest request) {
        passwordResetService.solicitarRestablecimiento(request.email());
        return ResponseEntity.accepted().build();
    }

    /** RF-34. */
    @PostMapping("/restablecer-password")
    public ResponseEntity<Void> restablecerPassword(@Valid @RequestBody RestablecerPasswordRequest request) {
        passwordResetService.restablecerPassword(request.token(), request.nuevaPassword());
        return ResponseEntity.noContent().build();
    }
}
