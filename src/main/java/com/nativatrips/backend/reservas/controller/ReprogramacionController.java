package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.DecisionReprogramacionRequest;
import com.nativatrips.backend.reservas.dto.SolicitudReprogramacionResponse;
import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.service.ReprogramacionService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
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

/** RF-37 (Anexo 16): bandeja de reprogramaciones del administrador. */
@RestController
@RequestMapping("/api/v1/reprogramaciones")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ReprogramacionController {

    private final ReprogramacionService reprogramacionService;

    public ReprogramacionController(ReprogramacionService reprogramacionService) {
        this.reprogramacionService = reprogramacionService;
    }

    @GetMapping
    public List<SolicitudReprogramacionResponse> listar(
            @RequestParam(defaultValue = "PENDIENTE") EstadoSolicitudReprogramacion estado) {
        return reprogramacionService.listar(estado);
    }

    /** El soporte trae datos de salud o de familia: nunca se guarda en cache. */
    @GetMapping("/{id}/soporte")
    public ResponseEntity<byte[]> soporte(@PathVariable UUID id) {
        ReprogramacionService.Soporte soporte = reprogramacionService.soporte(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(soporte.tipo()))
                .cacheControl(CacheControl.noStore())
                .header("Content-Disposition", "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(soporte.contenido());
    }

    @PostMapping("/{id}/decision")
    public SolicitudReprogramacionResponse decidir(
            @PathVariable UUID id,
            @Valid @RequestBody DecisionReprogramacionRequest decision,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return reprogramacionService.decidir(id, decision.aprobar(), decision.nuevaFecha(), decision.motivo(), principal.id());
    }
}
