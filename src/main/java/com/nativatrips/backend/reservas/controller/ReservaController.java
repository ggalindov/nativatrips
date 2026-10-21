package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.AsignarGuiaRequest;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.dto.MarcarAsistenciaRequest;
import com.nativatrips.backend.reservas.dto.ReservaResponse;
import com.nativatrips.backend.reservas.dto.RevisionRequest;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Operacion del equipo sobre las reservas; el turista gestiona la suya con el enlace (ADR-004). */
@RestController
@RequestMapping("/api/v1/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<ReservaResponse> listar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) EstadoReserva estado) {
        return reservaService.listarParaPanel(desde, hasta, estado);
    }

    @GetMapping("/en-revision")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<ReservaResponse> listarEnRevision() {
        return reservaService.listarEnRevision();
    }

    @PostMapping("/{id}/revision")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ReservaResponse revisar(
            @PathVariable UUID id,
            @Valid @RequestBody RevisionRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.revisarReserva(id, request.aprobar(), request.motivo(), principal.id());
    }

    @PostMapping("/{id}/asignar-guia")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ReservaResponse asignarGuia(@PathVariable UUID id, @Valid @RequestBody AsignarGuiaRequest request) {
        return reservaService.asignarGuia(id, request.guiaId());
    }

    @GetMapping("/agenda-guia")
    @PreAuthorize("hasRole('GUIA_TURISTICO')")
    public List<ReservaResponse> agendaGuia(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.obtenerAgendaGuia(principal.id(), fecha);
    }

    @GetMapping("/{id}/turistas")
    @PreAuthorize("hasRole('GUIA_TURISTICO')")
    public List<IntegranteResponse> turistas(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.obtenerTuristasParaGuia(id, principal.id());
    }

    @PostMapping("/{id}/asistencia")
    @PreAuthorize("hasRole('GUIA_TURISTICO')")
    public ReservaResponse registrarAsistencia(
            @PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.registrarAsistencia(id, principal.id());
    }

    @PutMapping("/{id}/integrantes/{integranteId}/asistencia")
    @PreAuthorize("hasRole('GUIA_TURISTICO')")
    public IntegranteResponse marcarAsistencia(
            @PathVariable UUID id,
            @PathVariable UUID integranteId,
            @Valid @RequestBody MarcarAsistenciaRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.marcarAsistenciaIntegrante(id, integranteId, request.asistio(), principal.id());
    }
}
