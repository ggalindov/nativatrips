package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import java.time.LocalDate;

/** RF-36: una reserva en el historial del correo. Sin datos de las personas: para eso esta el enlace de cada reserva. */
public record ReservaDelHistorialResponse(
        String codigo, Long senderoId, String senderoNombre, LocalDate fecha, int personas, EstadoReserva estado) {
}
