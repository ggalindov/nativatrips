package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.TipoGrupo;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/**
 * HU-02: los acompanantes son opcionales; los que falten se registran despues desde el enlace. Sin
 * tipo de grupo la reserva es estandar; los grupos corporativos y con necesidades especiales pasan a
 * revision del administrador (RF-09) y los requerimientos especiales llegan a la lista del guia (RF-11).
 */
public record ReservaSinCuentaRequest(
        @NotNull Long senderoId,
        @NotNull @FutureOrPresent LocalDate fechaTour,
        @Min(1) @Max(ReservaSinCuentaRequest.MAX_PERSONAS) int personas,
        @NotNull @Valid TitularRequest titular,
        @Size(max = ReservaSinCuentaRequest.MAX_PERSONAS - 1) List<@Valid AcompananteRequest> acompanantes,
        TipoGrupo tipoGrupo,
        @Size(max = 500) String requerimientosEspeciales) {

    /** Tope de sensatez por reserva; el limite real es la capacidad del dia. */
    public static final int MAX_PERSONAS = 50;

    public List<AcompananteRequest> acompanantes() {
        return acompanantes == null ? List.of() : acompanantes;
    }

    public TipoGrupo tipoGrupo() {
        return tipoGrupo == null ? TipoGrupo.ESTANDAR : tipoGrupo;
    }

    /** Recortado; null si llega vacio. */
    public String requerimientosEspeciales() {
        return requerimientosEspeciales == null || requerimientosEspeciales.isBlank()
                ? null
                : requerimientosEspeciales.strip();
    }
}
