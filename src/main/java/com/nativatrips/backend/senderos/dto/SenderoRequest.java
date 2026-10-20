package com.nativatrips.backend.senderos.dto;

import com.nativatrips.backend.senderos.model.NivelDificultad;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

/** La ficha tecnica es opcional; sin hora de salida se usan las 7:00. */
public record SenderoRequest(
        @NotBlank @Size(max = 200) String nombre,
        String descripcion,
        @NotNull NivelDificultad nivelDificultad,
        @Positive int duracionMinutos,
        @NotBlank @Size(max = 50) String tipoExperiencia,
        String requisitosIngreso,
        @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal precio,
        @DecimalMin(value = "0.1") BigDecimal distanciaKm,
        @PositiveOrZero Integer desnivelM,
        @Positive @Max(6000) Integer altitudMaxM,
        @Size(max = 120) String sector,
        LocalTime horaSalida,
        @Size(max = 200) String puntoEncuentro,
        @Size(max = 8) List<@NotBlank @Size(max = 120) String> destacados) {
}
