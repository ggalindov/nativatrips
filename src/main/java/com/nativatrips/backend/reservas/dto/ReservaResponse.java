package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Vista del equipo sobre una reserva: panel del administrador y lista del guia. */
public record ReservaResponse(
        UUID id,
        String codigoReserva,
        Long senderoId,
        UUID guiaId,
        String guiaNombre,
        LocalDate fechaTour,
        int cantidadPersonas,
        TipoGrupo tipoGrupo,
        EstadoReserva estado,
        Instant bloqueoExpiraEn,
        TitularResponse titular,
        String requerimientosEspeciales,
        Instant creadaEn,
        List<IntegranteResponse> integrantes) {

    public static ReservaResponse from(Reserva reserva, String guiaNombre, List<IntegranteResponse> integrantes) {
        return new ReservaResponse(
                reserva.getId(),
                reserva.getCodigoReserva(),
                reserva.getSenderoId(),
                reserva.getGuiaId(),
                guiaNombre,
                reserva.getFechaTour(),
                reserva.getCantidadPersonas(),
                reserva.getTipoGrupo(),
                reserva.getEstado(),
                reserva.getBloqueoExpiraEn(),
                reserva.getTitular() != null ? TitularResponse.from(reserva.getTitular()) : null,
                reserva.getRequerimientosEspeciales(),
                reserva.getCreatedAt(),
                integrantes);
    }
}
