package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.TipoDocumento;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Mismos datos y formatos que valida el formulario de reserva del frontend. */
public record TitularRequest(
        @NotBlank @Size(min = 3, max = 200) String nombre,
        @NotNull TipoDocumento tipoDocumento,
        @NotBlank @Pattern(regexp = "[A-Za-z0-9]{5,20}") String documento,
        @NotBlank @Pattern(regexp = "[A-Z]{2}") String nacionalidad,
        @NotBlank @Email @Size(max = 255) String correo,
        @NotBlank @Pattern(regexp = "\\d{1,4}") String indicativo,
        @NotBlank @Pattern(regexp = "\\d{6,14}") String celular) {
}
