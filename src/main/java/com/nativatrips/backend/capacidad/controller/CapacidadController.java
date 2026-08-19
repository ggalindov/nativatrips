package com.nativatrips.backend.capacidad.controller;

import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
public class CapacidadController {

    private final CapacidadService capacidadService;

    public CapacidadController(CapacidadService capacidadService) {
        this.capacidadService = capacidadService;
    }

    @GetMapping("/api/v1/senderos/{senderoId}/limites-capacidad")
    public List<LimiteCapacidadResponse> listar(@PathVariable Long senderoId) {
        return capacidadService.listarPorSendero(senderoId);
    }

    @PostMapping("/api/v1/senderos/{senderoId}/limites-capacidad")
    public ResponseEntity<LimiteCapacidadResponse> crear(
            @PathVariable Long senderoId,
            @Valid @RequestBody LimiteCapacidadRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        LimiteCapacidadResponse creado = capacidadService.crear(senderoId, request, principal.id());
        return ResponseEntity.created(URI.create("/api/v1/limites-capacidad/" + creado.id())).body(creado);
    }

    @PutMapping("/api/v1/limites-capacidad/{id}")
    public LimiteCapacidadResponse actualizar(@PathVariable Long id, @Valid @RequestBody LimiteCapacidadRequest request) {
        return capacidadService.actualizar(id, request);
    }
}
