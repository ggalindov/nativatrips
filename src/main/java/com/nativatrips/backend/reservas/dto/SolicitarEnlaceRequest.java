package com.nativatrips.backend.reservas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** HU-18 criterio 3: el titular que perdio el correo pide otro enlace con el codigo y su correo. */
public record SolicitarEnlaceRequest(
        @NotBlank @Size(max = 30) String codigo,
        @NotBlank @Email @Size(max = 255) String correo) {
}
