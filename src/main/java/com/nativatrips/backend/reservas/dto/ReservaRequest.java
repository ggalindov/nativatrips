package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.TipoGrupo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record ReservaRequest(
        @NotNull Long senderoId,
        @NotNull @FutureOrPresent LocalDate fechaTour,
        @NotNull TipoGrupo tipoGrupo,
        @NotEmpty List<@Valid IntegranteRequest> integrantes) {
}
