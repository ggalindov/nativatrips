package com.nativatrips.backend.senderos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.time.LocalTime;

/**
 * Datos tecnicos del recorrido que ve el turista en la ficha (HU-01). Son opcionales salvo la hora
 * de salida: el equipo los completa a medida que los mide en campo.
 */
@Embeddable
public record FichaTecnica(
        @Column(name = "distancia_km") BigDecimal distanciaKm,
        @Column(name = "desnivel_m") Integer desnivelM,
        @Column(name = "altitud_max_m") Integer altitudMaxM,
        @Column(name = "sector") String sector,
        @Column(name = "hora_salida", nullable = false) LocalTime horaSalida,
        @Column(name = "punto_encuentro") String puntoEncuentro) {

    public static final LocalTime HORA_SALIDA_POR_DEFECTO = LocalTime.of(7, 0);

    public FichaTecnica {
        if (horaSalida == null) {
            horaSalida = HORA_SALIDA_POR_DEFECTO;
        }
    }

    public static FichaTecnica sinDatos() {
        return new FichaTecnica(null, null, null, null, HORA_SALIDA_POR_DEFECTO, null);
    }
}
