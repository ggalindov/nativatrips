package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.ReservaDelHistorialResponse;
import com.nativatrips.backend.reservas.dto.SolicitarHistorialRequest;
import com.nativatrips.backend.reservas.service.HistorialPorCorreoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** RF-36: historial de reservas de un correo, sin cuenta. El token viaja en la cabecera X-Enlace-Historial. */
@RestController
@RequestMapping("/api/v1/mis-reservas")
public class MisReservasController {

    static final String CABECERA_ENLACE = "X-Enlace-Historial";

    private final HistorialPorCorreoService historialService;

    public MisReservasController(HistorialPorCorreoService historialService) {
        this.historialService = historialService;
    }

    @GetMapping
    public List<ReservaDelHistorialResponse> consultar(@RequestHeader(value = CABECERA_ENLACE, required = false) String token) {
        return historialService.consultar(token);
    }

    /** Siempre 202, exista o no el correo. */
    @PostMapping("/enlace")
    public ResponseEntity<Void> solicitarEnlace(@Valid @RequestBody SolicitarHistorialRequest solicitud) {
        historialService.solicitar(solicitud.correo());
        return ResponseEntity.accepted().build();
    }
}
