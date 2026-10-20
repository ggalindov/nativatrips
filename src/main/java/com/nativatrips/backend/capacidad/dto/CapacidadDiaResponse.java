package com.nativatrips.backend.capacidad.dto;

import com.nativatrips.backend.capacidad.model.CapacidadDia;
import java.time.LocalDate;
import java.util.UUID;

public record CapacidadDiaResponse(
        Long senderoId,
        LocalDate fecha,
        int cupoMaximo,
        short umbralAlertaPct,
        int ocupacion,
        int cupoDisponible,
        boolean umbralAlertaSuperado,
        UUID cargadoPorUsuarioId) {

    public static CapacidadDiaResponse from(CapacidadDia dia, int ocupacion) {
        return new CapacidadDiaResponse(
                dia.getSenderoId(),
                dia.getFecha(),
                dia.getCupoMaximo(),
                dia.getUmbralAlertaPct(),
                ocupacion,
                Math.max(dia.getCupoMaximo() - ocupacion, 0),
                dia.umbralSuperadoCon(ocupacion),
                dia.getCargadoPorUsuarioId());
    }
}
