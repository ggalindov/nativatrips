package com.nativatrips.backend.senderos.dto;

import com.nativatrips.backend.senderos.model.NivelDificultad;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record SenderoRequest(
        @NotBlank @Size(max = 200) String nombre,
        String descripcion,
        @NotNull NivelDificultad nivelDificultad,
        @Positive int duracionMinutos,
        @NotBlank @Size(max = 50) String tipoExperiencia,
        String requisitosIngreso,
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal precio) {
}
