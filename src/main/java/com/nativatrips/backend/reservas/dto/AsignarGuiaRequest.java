package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AsignarGuiaRequest(@NotNull UUID guiaId) {
}
