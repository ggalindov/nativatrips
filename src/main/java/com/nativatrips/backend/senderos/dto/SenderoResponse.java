package com.nativatrips.backend.senderos.dto;

import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import java.math.BigDecimal;

public record SenderoResponse(
        Long id,
        String nombre,
        String descripcion,
        NivelDificultad nivelDificultad,
        int duracionMinutos,
        String tipoExperiencia,
        String requisitosIngreso,
        BigDecimal precio,
        boolean activo) {

    public static SenderoResponse from(Sendero sendero) {
        return new SenderoResponse(
                sendero.getId(),
                sendero.getNombre(),
                sendero.getDescripcion(),
                sendero.getNivelDificultad(),
                sendero.getDuracionMinutos(),
                sendero.getTipoExperiencia(),
                sendero.getRequisitosIngreso(),
                sendero.getPrecio(),
                sendero.isActivo());
    }
}
