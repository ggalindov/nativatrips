package com.nativatrips.backend.pagos.dto;

/**
 * Campos exactos que el frontend debe enviar como un formulario HTML POST (no JSON, no fetch)
 * al campo {@code checkoutUrl} de PayU WebCheckout — es una redireccion de navegador, PayU
 * responde con su propia pagina de pago.
 */
public record IniciarPagoResponse(
        String checkoutUrl,
        String merchantId,
        String accountId,
        String description,
        String referenceCode,
        String amount,
        String tax,
        String taxReturnBase,
        String currency,
        String signature,
        String test,
        String buyerEmail,
        String responseUrl,
        String confirmationUrl) {
}
