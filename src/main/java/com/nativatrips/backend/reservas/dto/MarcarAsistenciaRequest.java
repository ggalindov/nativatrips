package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.NotNull;

public record MarcarAsistenciaRequest(@NotNull Boolean asistio) {
}
