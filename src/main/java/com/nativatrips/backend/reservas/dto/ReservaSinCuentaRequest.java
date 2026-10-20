package com.nativatrips.backend.reservas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/** HU-02: los acompanantes se registran despues, desde el enlace de la reserva (Sprint 2). */
public record ReservaSinCuentaRequest(
        @NotNull Long senderoId,
        @NotNull @FutureOrPresent LocalDate fechaTour,
        @Min(1) @Max(ReservaSinCuentaRequest.MAX_PERSONAS) int personas,
        @NotNull @Valid TitularRequest titular) {

    /** Tope de sensatez por reserva; el limite real es la capacidad del dia. */
    public static final int MAX_PERSONAS = 50;
}
