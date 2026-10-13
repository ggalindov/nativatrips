package com.nativatrips.backend.capacidad.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record LimiteCapacidadRequest(
        @NotNull LocalDate temporadaInicio,
        @NotNull LocalDate temporadaFin,
        @Positive int cupoMaximoDia,
        @Min(1) @Max(100) Short umbralAlertaPct,
        @Size(max = 200) String configuradoPorExterno) {
}
