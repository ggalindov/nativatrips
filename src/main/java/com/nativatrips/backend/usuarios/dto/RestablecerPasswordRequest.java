package com.nativatrips.backend.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RestablecerPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 100) String nuevaPassword) {
}
