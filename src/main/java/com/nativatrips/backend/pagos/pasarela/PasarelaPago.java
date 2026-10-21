package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.pagos.model.Pago;
import java.time.Instant;

/**
 * ADR-005: lo que cambia de una pasarela a otra. PagoService no conoce a PayU ni a Wompi; cada
 * adaptador arma su checkout y verifica la firma de sus eventos antes de entregar un ResultadoPago.
 */
public interface PasarelaPago {

    /**
     * Datos para llevar al turista al checkout por el monto del pago.
     *
     * @param venceEn hasta cuando se puede pagar: el vencimiento del apartado del cupo.
     */
    CheckoutPago prepararCheckout(Pago pago, Instant venceEn, String correoComprador);
}
