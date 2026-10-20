package com.nativatrips.backend.capacidad.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Dias que el administrador carga de una vez para un sendero (normalmente una semana). */
public record CargaCapacidadRequest(
        @NotEmpty @Size(max = CargaCapacidadRequest.MAX_DIAS) List<@Valid CapacidadDiaRequest> dias) {

    public static final int MAX_DIAS = 62;
}
