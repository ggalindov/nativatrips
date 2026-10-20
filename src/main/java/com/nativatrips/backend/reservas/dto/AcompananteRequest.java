package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.TipoDocumento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Persona del grupo distinta del titular; las mismas reglas de documento que el titular. */
public record AcompananteRequest(
        @NotBlank @Size(min = 3, max = 200) String nombre,
        @NotNull TipoDocumento tipoDocumento,
        @NotBlank @Pattern(regexp = "[A-Za-z0-9]{5,20}") String documento,
        @NotBlank @Pattern(regexp = "[A-Z]{2}") String nacionalidad) {
}
