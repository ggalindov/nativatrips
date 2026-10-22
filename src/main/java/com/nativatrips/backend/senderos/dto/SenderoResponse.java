package com.nativatrips.backend.senderos.dto;

import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

public record SenderoResponse(
        Long id,
        String nombre,
        String descripcion,
        NivelDificultad nivelDificultad,
        int duracionMinutos,
        String tipoExperiencia,
        String requisitosIngreso,
        BigDecimal precio,
        boolean activo,
        boolean publicado,
        BigDecimal distanciaKm,
        Integer desnivelM,
        Integer altitudMaxM,
        String sector,
        LocalTime horaSalida,
        String puntoEncuentro,
        List<String> destacados,
        List<String> fotos) {

    /** @param fotos URLs de las fotos del sendero, en orden */
    public static SenderoResponse from(Sendero sendero, List<String> fotos) {
        return new SenderoResponse(
                sendero.getId(),
                sendero.getNombre(),
                sendero.getDescripcion(),
                sendero.getNivelDificultad(),
                sendero.getDuracionMinutos(),
                sendero.getTipoExperiencia(),
                sendero.getRequisitosIngreso(),
                sendero.getPrecio(),
                sendero.isActivo(),
                sendero.isPublicado(),
                sendero.getFicha().distanciaKm(),
                sendero.getFicha().desnivelM(),
                sendero.getFicha().altitudMaxM(),
                sendero.getFicha().sector(),
                sendero.getFicha().horaSalida(),
                sendero.getFicha().puntoEncuentro(),
                sendero.getDestacados(),
                fotos);
    }
}
