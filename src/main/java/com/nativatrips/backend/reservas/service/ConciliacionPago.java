package com.nativatrips.backend.reservas.service;

import java.util.UUID;

/**
 * Puerto que el job de expiracion usa antes de liberar un cupo (HU-03 criterio 5): pregunta a la
 * pasarela si la reserva ya se pago y el evento se perdio. Lo implementa el modulo de pagos; asi
 * reservas no depende de pagos.
 */
public interface ConciliacionPago {

    enum Resultado {
        /** La pasarela confirma el pago: la reserva ya quedo CONFIRMADA y no se expira. */
        PAGADA,
        /** No hay pago aprobado: se puede liberar el cupo. */
        SIN_PAGO,
        /** No se pudo saber (pasarela caida o transaccion en proceso): se vuelve a intentar luego. */
        SIN_RESPUESTA
    }

    Resultado conciliar(UUID reservaId);
}
