package com.nativatrips.backend.capacidad.controller;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.CargaCapacidadRequest;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
}
