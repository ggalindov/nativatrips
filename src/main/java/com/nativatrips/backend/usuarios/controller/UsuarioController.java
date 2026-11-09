package com.nativatrips.backend.usuarios.controller;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.usuarios.dto.UsuarioResponse;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /** Guias activos, para asignarlos a las reservas confirmadas desde el panel. */
    @GetMapping("/guias")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<UsuarioResponse> guias() {
        return usuarioRepository.findByRolAndActivoTrue(Rol.GUIA_TURISTICO).stream()
                .map(UsuarioResponse::from)
                .sorted(Comparator.comparing(UsuarioResponse::nombreCompleto, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }
}
