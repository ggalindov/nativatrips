package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.AcompananteRequest;
import com.nativatrips.backend.reservas.dto.MiReservaResponse;
import com.nativatrips.backend.reservas.dto.SolicitarEnlaceRequest;
import com.nativatrips.backend.reservas.dto.SolicitudReprogramacionResponse;
import com.nativatrips.backend.reservas.model.CausalReprogramacion;
import com.nativatrips.backend.reservas.service.MiReservaService;
import com.nativatrips.backend.reservas.service.ReprogramacionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * HU-18 (NAT-112), ADR-004: gestion de la reserva sin cuenta. El token del enlace viaja en la
 * cabecera X-Enlace-Reserva y no en la URL, para que no quede en los registros de acceso.
 */
@RestController
@RequestMapping("/api/v1/mi-reserva")
public class MiReservaController {

    static final String CABECERA_ENLACE = "X-Enlace-Reserva";

    private final MiReservaService miReservaService;
    private final ReprogramacionService reprogramacionService;

    public MiReservaController(MiReservaService miReservaService, ReprogramacionService reprogramacionService) {
        this.miReservaService = miReservaService;
        this.reprogramacionService = reprogramacionService;
    }

    @GetMapping
    public MiReservaResponse consultar(
            @RequestHeader(value = CABECERA_ENLACE, required = false) String token, HttpServletRequest request) {
        return miReservaService.consultar(token, request.getRemoteAddr());
    }

    @PostMapping("/acompanantes")
    public MiReservaResponse agregarAcompanante(
            @RequestHeader(value = CABECERA_ENLACE, required = false) String token,
            @Valid @RequestBody AcompananteRequest acompanante,
            HttpServletRequest request) {
        return miReservaService.agregarAcompanante(token, acompanante, request.getRemoteAddr());
    }

    /** RF-37 (Anexo 16): nueva fecha con causal y soporte (PDF, JPG o PNG de hasta 5 MB). */
    @PostMapping(value = "/reprogramacion", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SolicitudReprogramacionResponse> solicitarReprogramacion(
            @RequestHeader(value = CABECERA_ENLACE, required = false) String token,
            @RequestParam CausalReprogramacion causal,
            @RequestParam String descripcion,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDeseada,
            @RequestPart("soporte") MultipartFile soporte,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reprogramacionService.solicitar(
                token, causal, descripcion, fechaDeseada, soporte, request.getRemoteAddr()));
    }

    /** Siempre 202, exista o no la reserva (HU-18 criterio 3). */
    @PostMapping("/enlace")
    public ResponseEntity<Void> solicitarEnlace(@Valid @RequestBody SolicitarEnlaceRequest solicitud) {
        miReservaService.solicitarEnlace(solicitud.codigo(), solicitud.correo());
        return ResponseEntity.accepted().build();
    }
}
