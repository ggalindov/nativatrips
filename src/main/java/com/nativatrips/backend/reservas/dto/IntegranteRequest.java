package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IntegranteRequest(
        @NotBlank @Size(max = 200) String nombreCompleto,
        @NotBlank @Size(max = 30) String documentoIdentidad) {
}
