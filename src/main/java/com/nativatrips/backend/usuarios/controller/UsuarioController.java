package com.nativatrips.backend.usuarios.controller;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.usuarios.dto.UsuarioResponse;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        var usuario = usuarioRepository.findById(principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
        return ResponseEntity.ok(UsuarioResponse.from(usuario));
    }
}
