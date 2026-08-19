package com.nativatrips.backend.capacidad.dto;

import java.time.LocalDate;

public record DisponibilidadResponse(
        Long senderoId,
        LocalDate fecha,
        int cupoMaximoDia,
        int ocupacionActual,
        int cupoDisponible,
        boolean umbralAlertaSuperado) {
}
