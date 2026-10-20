package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.PayuProperties;
import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.dto.IniciarPagoResponse;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.service.PayuSignatureService;
import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Adaptador de PayU WebCheckout: formulario firmado con MD5 y webhook de confirmacion. */
@Component
public class PayuPasarela implements PasarelaPago {

    private static final Logger log = LoggerFactory.getLogger(PayuPasarela.class);

    private final PayuSignatureService signatureService;
    private final PayuProperties payuProperties;

    public PayuPasarela(PayuSignatureService signatureService, PayuProperties payuProperties) {
        this.signatureService = signatureService;
        this.payuProperties = payuProperties;
    }

    /** RF-06: campos del formulario WebCheckout que el frontend envia hacia PayU. */
    @Override
    public CheckoutPago prepararCheckout(Pago pago, String descripcion, String correoComprador) {
        String firma = signatureService.generarFirmaSolicitud(
                pago.getReferenciaPayu(), pago.getMonto(), payuProperties.getCurrency());

        return new IniciarPagoResponse(
                payuProperties.getCheckoutUrl(),
                payuProperties.getMerchantId(),
                payuProperties.getAccountId(),
                descripcion,
                pago.getReferenciaPayu(),
                signatureService.formatearMonto(pago.getMonto()),
                "0",
                "0",
                payuProperties.getCurrency(),
                firma,
                payuProperties.isTestMode() ? "1" : "0",
                correoComprador,
                payuProperties.getResponseUrl(),
                payuProperties.getConfirmationUrl());
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
