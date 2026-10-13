package com.nativatrips.backend.pagos.dto;

/** Subconjunto de los campos que PayU envia en el webhook de confirmacion (POST form-urlencoded). */
public record ConfirmacionPayuPayload(
        String referenceSale,
        String value,
        String currency,
        String statePol,
        String sign,
        String transactionId,
        String rawPayload) {
}
