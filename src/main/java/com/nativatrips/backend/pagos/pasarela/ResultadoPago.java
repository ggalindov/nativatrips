package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.pagos.model.EstadoPago;
import java.math.BigDecimal;

/**
 * Resultado de una transaccion ya verificado por su adaptador (firma valida). PagoService todavia
 * compara el monto y la moneda con los del pago antes de aplicarlo.
 *
 * @param detalle texto para el historial, p. ej. el estado original de la pasarela.
 * @param respuestaCruda evento recibido tal cual, para auditoria.
 */
public record ResultadoPago(
        String referencia,
        String transaccionId,
        EstadoPago estado,
        BigDecimal monto,
        String moneda,
        String detalle,
        String respuestaCruda) {
}
