package com.nativatrips.backend.capacidad.controller;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.CargaCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class CapacidadController {

    private final CapacidadService capacidadService;

    public CapacidadController(CapacidadService capacidadService) {
        this.capacidadService = capacidadService;
    }

    /** Capacidad cargada de todos los senderos en un rango de fechas, con su ocupacion. */
    @GetMapping("/api/v1/capacidad")
    public List<CapacidadDiaResponse> consultarDias(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return capacidadService.consultarDias(desde, hasta);
    }

    /** Carga o corrige la capacidad de uno o varios dias de un sendero (ADR-008). */
    @PutMapping("/api/v1/senderos/{senderoId}/capacidad")
    public List<CapacidadDiaResponse> cargarDias(
            @PathVariable Long senderoId,
            @Valid @RequestBody CargaCapacidadRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return capacidadService.cargarDias(senderoId, request.dias(), principal.id());
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
