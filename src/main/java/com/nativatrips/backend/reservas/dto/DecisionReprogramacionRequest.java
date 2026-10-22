package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Al aprobar, {@code nuevaFecha} puede ajustar la fecha que pidio el turista; vacia, se usa la pedida. */
public record DecisionReprogramacionRequest(@NotNull Boolean aprobar, LocalDate nuevaFecha, @Size(max = 500) String motivo) {
}
