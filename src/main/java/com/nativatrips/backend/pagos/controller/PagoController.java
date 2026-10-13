package com.nativatrips.backend.pagos.controller;

import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.dto.IniciarPagoResponse;
import com.nativatrips.backend.pagos.dto.PagoResponse;
import com.nativatrips.backend.pagos.service.PagoService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PagoController {

    private static final Logger log = LoggerFactory.getLogger(PagoController.class);

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping("/api/v1/reservas/{id}/pago")
    @PreAuthorize("hasRole('TURISTA')")
    public IniciarPagoResponse iniciarPago(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return pagoService.iniciarPago(id, principal.id(), principal.email());
    }

    @GetMapping("/api/v1/reservas/{id}/pago")
    @PreAuthorize("hasRole('TURISTA')")
    public ResponseEntity<PagoResponse> obtenerPago(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser principal) {
        return pagoService.obtenerUltimoPago(id, principal.id())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Webhook de confirmacion de PayU: PayU lo invoca directamente (sin JWT), por eso esta ruta
     * esta en la lista permitAll de SecurityConfig. La autenticidad se valida con la firma MD5
     * de PayU, no con Spring Security. Debe responder 200 con cuerpo vacio o PayU reintenta.
     */
    @PostMapping("/api/v1/pagos/confirmacion")
    public ResponseEntity<Void> confirmacion(HttpServletRequest request) {
        ConfirmacionPayuPayload payload = new ConfirmacionPayuPayload(
                param(request, "reference_sale"),
                param(request, "value"),
                param(request, "currency"),
                param(request, "state_pol"),
                param(request, "sign"),
                param(request, "transaction_id"),
                request.getParameterMap().toString());

        try {
            pagoService.procesarConfirmacion(payload);
        } catch (Exception ex) {
            // PayU reintenta si no recibe 200; registramos el error pero no lo propagamos como
            // 500 automatico para no generar reintentos infinitos sobre una firma invalida.
            log.error("Error procesando confirmacion de PayU para referencia {}", payload.referenceSale(), ex);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        return ResponseEntity.ok().build();
    }

    private String param(HttpServletRequest request, String nombre) {
        String valor = request.getParameter(nombre);
        return valor != null ? valor : "";
    }
}
