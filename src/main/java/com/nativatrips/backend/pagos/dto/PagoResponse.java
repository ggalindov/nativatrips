package com.nativatrips.backend.pagos.dto;

import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import java.math.BigDecimal;
import java.util.UUID;

public record PagoResponse(
        UUID id,
        UUID reservaId,
        String referencia,
        String transaccionId,
        BigDecimal monto,
        String moneda,
        EstadoPago estado) {

    public static PagoResponse from(Pago pago) {
        return new PagoResponse(
                pago.getId(),
                pago.getReservaId(),
                pago.getReferencia(),
                pago.getTransaccionId(),
                pago.getMonto(),
                pago.getMoneda(),
                pago.getEstado());
    }
}
