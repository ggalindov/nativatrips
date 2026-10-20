package com.nativatrips.backend.capacidad.dto;

import java.time.LocalDate;

/**
 * Un dia del calendario de un sendero. {@code publicada} dice si el administrador ya cargo la
 * capacidad; {@code reservable}, si hoy se puede reservar con cobro (dia publicado, dentro de la
 * ventana y con cupos libres).
 */
public record DiaCalendarioResponse(
        LocalDate fecha,
        boolean publicada,
        boolean reservable,
        int cupoMaximo,
        int ocupacion,
        int cupoDisponible,
        boolean umbralAlertaSuperado) {
}
