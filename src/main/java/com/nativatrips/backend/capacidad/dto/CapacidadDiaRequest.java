package com.nativatrips.backend.capacidad.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

/** Capacidad de un dia; sin umbral se usa el 80 %. */
public record CapacidadDiaRequest(
        @NotNull LocalDate fecha,
        @Positive int cupoMaximo,
        @Min(1) @Max(100) Short umbralAlertaPct) {
}
