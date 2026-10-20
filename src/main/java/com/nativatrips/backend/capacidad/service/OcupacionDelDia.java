package com.nativatrips.backend.capacidad.service;

import java.time.LocalDate;

/**
 * Puerto que la capacidad necesita para no dejar un cupo por debajo de lo ya vendido. Lo
 * implementa el modulo de reservas: asi la capacidad no depende de reservas (ADR-008).
 */
public interface OcupacionDelDia {

    /** Personas con reserva que ocupa cupo en el sendero para la fecha. */
    int personasReservadas(Long senderoId, LocalDate fecha);
}
