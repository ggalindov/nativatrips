package com.nativatrips.backend.reservas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/** HU-02: los acompanantes son opcionales; los que falten se registran despues desde el enlace (Sprint 2). */
public record ReservaSinCuentaRequest(
        @NotNull Long senderoId,
        @NotNull @FutureOrPresent LocalDate fechaTour,
        @Min(1) @Max(ReservaSinCuentaRequest.MAX_PERSONAS) int personas,
        @NotNull @Valid TitularRequest titular,
        @Size(max = ReservaSinCuentaRequest.MAX_PERSONAS - 1) List<@Valid AcompananteRequest> acompanantes) {

    /** Tope de sensatez por reserva; el limite real es la capacidad del dia. */
    public static final int MAX_PERSONAS = 50;

    public List<AcompananteRequest> acompanantes() {
        return acompanantes == null ? List.of() : acompanantes;
    }
}
