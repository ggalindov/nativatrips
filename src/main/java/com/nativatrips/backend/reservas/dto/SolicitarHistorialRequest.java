package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitarHistorialRequest(@NotBlank @Email @Size(max = 255) String correo) {
}
