package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ReservaResponse(
        UUID id,
        String codigoReserva,
        Long senderoId,
        UUID turistaId,
        UUID guiaId,
        LocalDate fechaTour,
        int cantidadPersonas,
        TipoGrupo tipoGrupo,
        EstadoReserva estado,
        Instant bloqueoExpiraEn,
        List<IntegranteResponse> integrantes) {

    public static ReservaResponse from(Reserva reserva, List<IntegranteResponse> integrantes) {
        return new ReservaResponse(
                reserva.getId(),
                reserva.getCodigoReserva(),
                reserva.getSenderoId(),
                reserva.getTuristaId(),
                reserva.getGuiaId(),
                reserva.getFechaTour(),
                reserva.getCantidadPersonas(),
                reserva.getTipoGrupo(),
                reserva.getEstado(),
                reserva.getBloqueoExpiraEn(),
                integrantes);
    }
}
