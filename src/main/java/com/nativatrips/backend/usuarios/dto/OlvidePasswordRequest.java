package com.nativatrips.backend.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OlvidePasswordRequest(@NotBlank @Email String email) {
}
