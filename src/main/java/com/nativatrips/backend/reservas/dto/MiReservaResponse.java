package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.CausalReprogramacion;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** HU-18 criterio 2: lo que ve el titular al abrir su enlace. Coincide con el tipo Reserva del frontend. */
public record MiReservaResponse(
        String codigo,
        Long senderoId,
        String senderoNombre,
        LocalDate fecha,
        LocalTime horaSalida,
        int personas,
        TitularResponse titular,
        List<PersonaResponse> acompanantes,
        EstadoReserva estado,
        Instant bloqueoExpiraEn,
        String guia,
        String puntoEncuentro,
        TipoGrupo tipoGrupo,
        String requerimientosEspeciales,
        Reprogramacion reprogramacion) {

    /** RF-37: la ultima solicitud de cambio de fecha, si la hay. */
    public record Reprogramacion(
            CausalReprogramacion causal, LocalDate fechaDeseada, EstadoSolicitudReprogramacion estado, String motivoDecision) {
    }
}
