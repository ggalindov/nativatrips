package com.nativatrips.backend.reservas.model;

import java.util.List;

public enum EstadoReserva {
    PENDIENTE_PAGO,
    EN_REVISION,
    CONFIRMADA,
    CANCELADA,
    EXPIRADA,
    COMPLETADA;

    private static final List<EstadoReserva> QUE_OCUPAN_CUPO = List.of(PENDIENTE_PAGO, EN_REVISION, CONFIRMADA);

    /** Estados en los que la reserva cuenta contra la capacidad del dia. */
    public static List<EstadoReserva> queOcupanCupo() {
        return QUE_OCUPAN_CUPO;
    }
}
