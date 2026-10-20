package com.nativatrips.backend.pagos.controller;

import com.nativatrips.backend.pagos.pasarela.VerificadorEventosWompi;
import com.nativatrips.backend.pagos.service.PagoService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook de Wompi (ADR-005). Wompi no envia JWT: la autenticidad se valida con el checksum del
 * evento. Responde 200 cuando el evento se aplico o no aplica; Wompi reintenta ante cualquier otra
 * respuesta.
 */
@RestController
public class EventoWompiController {

    private final VerificadorEventosWompi verificador;
    private final PagoService pagoService;

    public EventoWompiController(VerificadorEventosWompi verificador, PagoService pagoService) {
        this.verificador = verificador;
        this.pagoService = pagoService;
    }

    @PostMapping(value = "/api/v1/pagos/wompi/eventos", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> recibir(
            @RequestBody String cuerpo, @RequestHeader(value = "X-Event-Checksum", required = false) String checksum) {
        verificador.verificar(cuerpo, checksum).ifPresent(pagoService::aplicarResultado);
        return ResponseEntity.ok().build();
    }
}
