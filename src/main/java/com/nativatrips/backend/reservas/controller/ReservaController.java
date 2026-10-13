package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.AsignarGuiaRequest;
import com.nativatrips.backend.reservas.dto.CancelarReservaRequest;
import com.nativatrips.backend.reservas.dto.HistorialEntradaResponse;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.dto.ReservaRequest;
import com.nativatrips.backend.reservas.dto.ReservaResponse;
import com.nativatrips.backend.reservas.dto.RevisionRequest;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reservas")
@PreAuthorize("hasRole('TURISTA')")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    public ResponseEntity<ReservaResponse> crear(
            @Valid @RequestBody ReservaRequest request, @AuthenticationPrincipal AuthenticatedUser principal) {
        ReservaResponse creada = reservaService.crearReserva(request, principal.id());
        return ResponseEntity.created(URI.create("/api/v1/reservas/" + creada.id())).body(creada);
    }

    @GetMapping("/mias")
    public List<ReservaResponse> misReservas(@AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.listarMisReservas(principal.id());
    }

    @GetMapping("/{id}")
    public ReservaResponse obtener(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.obtenerParaTurista(id, principal.id());
    }

    @GetMapping("/{id}/historial")
    public List<HistorialEntradaResponse> historial(
            @PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.obtenerHistorialParaTurista(id, principal.id());
    }

    @PostMapping("/{id}/cancelar")
    public ReservaResponse cancelar(
            @PathVariable UUID id,
            @RequestBody(required = false) CancelarReservaRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        String motivo = request != null ? request.motivo() : null;
        return reservaService.cancelarPorTurista(id, principal.id(), motivo);
    }

    @GetMapping("/en-revision")
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
    public List<ReservaResponse> listarEnRevision() {
        return reservaService.listarEnRevision();
    }

    @PostMapping("/{id}/revision")
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
    public ReservaResponse revisar(
            @PathVariable UUID id,
            @Valid @RequestBody RevisionRequest request,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return reservaService.revisarReserva(id, request.aprobar(), request.motivo(), principal.id());
    }

    @PostMapping("/{id}/asignar-guia")
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
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
}
