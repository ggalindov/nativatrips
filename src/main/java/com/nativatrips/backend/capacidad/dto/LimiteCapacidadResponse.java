package com.nativatrips.backend.capacidad.dto;

import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import java.time.LocalDate;
import java.util.UUID;

public record LimiteCapacidadResponse(
        Long id,
        Long senderoId,
        LocalDate temporadaInicio,
        LocalDate temporadaFin,
        int cupoMaximoDia,
        short umbralAlertaPct,
        UUID configuradoPorUsuarioId,
        String configuradoPorExterno) {

    public static LimiteCapacidadResponse from(LimiteCapacidad limite) {
        return new LimiteCapacidadResponse(
                limite.getId(),
                limite.getSenderoId(),
                limite.getTemporadaInicio(),
                limite.getTemporadaFin(),
                limite.getCupoMaximoDia(),
                limite.getUmbralAlertaPct(),
                limite.getConfiguradoPorUsuarioId(),
                limite.getConfiguradoPorExterno());
    }
}
