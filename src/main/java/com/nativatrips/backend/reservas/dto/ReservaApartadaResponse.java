package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import java.time.Instant;
import java.time.LocalDate;

/** Lo que ve quien reserva sin cuenta: el codigo y hasta cuando se le guarda el cupo. Sin datos personales. */
public record ReservaApartadaResponse(
        String codigoReserva,
        Long senderoId,
        LocalDate fechaTour,
        int cantidadPersonas,
        EstadoReserva estado,
        Instant bloqueoExpiraEn) {

    public static ReservaApartadaResponse from(Reserva reserva) {
        return new ReservaApartadaResponse(
                reserva.getCodigoReserva(),
                reserva.getSenderoId(),
                reserva.getFechaTour(),
                reserva.getCantidadPersonas(),
                reserva.getEstado(),
                reserva.getBloqueoExpiraEn());
    }
}
