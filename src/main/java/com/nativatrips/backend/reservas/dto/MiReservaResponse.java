package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** HU-18 criterio 2: lo que ve el titular al abrir su enlace. Coincide con el tipo Reserva del frontend. */
public record MiReservaResponse(
        String codigo,
        Long senderoId,
        String senderoNombre,
        LocalDate fecha,
        LocalTime horaSalida,
        int personas,
        TitularResponse titular,
        List<PersonaResponse> acompanantes,
        EstadoReserva estado,
        Instant bloqueoExpiraEn,
        String guia,
        String puntoEncuentro) {
}
