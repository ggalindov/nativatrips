package com.nativatrips.backend.pagos.pasarela;

import java.time.Instant;

/**
 * Lo que necesita el navegador para ir al Web Checkout de Wompi. {@code url} ya trae todos los
 * parametros firmados; los demas campos se devuelven para mostrarlos o para usar el widget.
 */
public record CheckoutWompi(
        String url,
        String llavePublica,
        String referencia,
        long montoEnCentavos,
        String moneda,
        String firmaIntegridad,
        Instant venceEn,
        String urlRedireccion) implements CheckoutPago {
}
