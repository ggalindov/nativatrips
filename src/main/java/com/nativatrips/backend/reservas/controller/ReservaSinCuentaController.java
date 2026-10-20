package com.nativatrips.backend.reservas.controller;

import com.nativatrips.backend.reservas.dto.ReservaApartadaResponse;
import com.nativatrips.backend.reservas.dto.ReservaSinCuentaRequest;
import com.nativatrips.backend.reservas.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** HU-02 (NAT-83), ADR-004: reserva publica, sin cuenta ni sesion. */
@RestController
public class ReservaSinCuentaController {

    private final ReservaService reservaService;

    public ReservaSinCuentaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    /** RF-05: aparta el cupo 15 minutos y envia el codigo al correo del titular. */
    @PostMapping("/api/v1/reservas/sin-cuenta")
    public ResponseEntity<ReservaApartadaResponse> crear(@Valid @RequestBody ReservaSinCuentaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.crearReservaSinCuenta(request));
    }
}
