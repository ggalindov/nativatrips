package com.nativatrips.backend.pagos.controller;

import com.nativatrips.backend.pagos.dto.PagoResponse;
import com.nativatrips.backend.pagos.pasarela.CheckoutPago;
import com.nativatrips.backend.pagos.service.PagoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * HU-03 (ADR-005): el titular paga el total y consulta el pago desde el enlace magico de su reserva
 * (cabecera X-Enlace-Reserva, como en mi reserva). No hay pago con sesion de turista.
 */
@RestController
public class PagoController {

    private static final String CABECERA_ENLACE = "X-Enlace-Reserva";

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping("/api/v1/mi-reserva/pago")
    public CheckoutPago iniciarPago(
            @RequestHeader(value = CABECERA_ENLACE, required = false) String token, HttpServletRequest request) {
        return pagoService.iniciarPagoConEnlace(token, request.getRemoteAddr());
    }

    @GetMapping("/api/v1/mi-reserva/pago")
    public ResponseEntity<PagoResponse> ultimoPago(
            @RequestHeader(value = CABECERA_ENLACE, required = false) String token, HttpServletRequest request) {
        return pagoService.ultimoPagoConEnlace(token, request.getRemoteAddr())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
