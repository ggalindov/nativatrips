package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.service.PayuSignatureService;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Webhook de PayU WebCheckout (firma MD5), mientras se retira PayU (ADR-005). Ya no arma checkouts. */
@Component
public class PayuPasarela {

    private static final Logger log = LoggerFactory.getLogger(PayuPasarela.class);

    private final PayuSignatureService signatureService;

    public PayuPasarela(PayuSignatureService signatureService) {
        this.signatureService = signatureService;
    }

    /**
     * RF-07: valida la firma MD5 de la confirmacion antes de confiar en el resultado; sin esto,
     * cualquiera podria enviar un "pago aprobado" falso.
     */
    public ResultadoPago verificar(ConfirmacionPayuPayload payload) {
        boolean firmaValida = signatureService.validarFirmaConfirmacion(
                payload.referenceSale(), payload.value(), payload.currency(), payload.statePol(), payload.sign());
        if (!firmaValida) {
            log.warn("Firma invalida en confirmacion de PayU para referencia {}", payload.referenceSale());
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "Firma de confirmacion invalida");
        }

        return new ResultadoPago(
                payload.referenceSale(),
                payload.transactionId(),
                mapearEstado(payload.statePol()),
                new BigDecimal(payload.value()),
                payload.currency(),
                "Confirmacion PayU recibida (state_pol=" + payload.statePol() + ")",
                payload.rawPayload());
    }

    private EstadoPago mapearEstado(String statePol) {
        return switch (statePol) {
            case "4" -> EstadoPago.APROBADO;
            case "6" -> EstadoPago.RECHAZADO;
            case "5" -> EstadoPago.EXPIRADO;
            case "7" -> EstadoPago.PENDIENTE;
            default -> EstadoPago.ERROR;
        };
    }
}
