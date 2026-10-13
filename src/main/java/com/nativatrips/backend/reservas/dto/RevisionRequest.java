package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RevisionRequest(@NotNull Boolean aprobar, @Size(max = 500) String motivo) {
}
