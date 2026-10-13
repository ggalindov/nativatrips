package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.ReservaEstadoHistorial;
import java.time.Instant;

public record HistorialEntradaResponse(
        EstadoReserva estadoAnterior,
        EstadoReserva estadoNuevo,
        String motivo,
        OrigenCambioEstado origen,
        Instant fecha) {

    public static HistorialEntradaResponse from(ReservaEstadoHistorial historial) {
        return new HistorialEntradaResponse(
                historial.getEstadoAnterior(),
                historial.getEstadoNuevo(),
                historial.getMotivo(),
                historial.getOrigen(),
                historial.getCreatedAt());
    }
}
