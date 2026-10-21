package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.AcompananteRequest;
import com.nativatrips.backend.reservas.dto.MiReservaResponse;
import com.nativatrips.backend.reservas.dto.SolicitarEnlaceRequest;
import com.nativatrips.backend.reservas.service.MiReservaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HU-18 (NAT-112), ADR-004: gestion de la reserva sin cuenta. El token del enlace viaja en la
 * cabecera X-Enlace-Reserva y no en la URL, para que no quede en los registros de acceso.
 */
@RestController
@RequestMapping("/api/v1/mi-reserva")
public class MiReservaController {

    static final String CABECERA_ENLACE = "X-Enlace-Reserva";

    private final MiReservaService miReservaService;

    public MiReservaController(MiReservaService miReservaService) {
        this.miReservaService = miReservaService;
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

    /** Siempre 202, exista o no la reserva (HU-18 criterio 3). */
    @PostMapping("/enlace")
    public ResponseEntity<Void> solicitarEnlace(@Valid @RequestBody SolicitarEnlaceRequest solicitud) {
        miReservaService.solicitarEnlace(solicitud.codigo(), solicitud.correo());
        return ResponseEntity.accepted().build();
    }
}
