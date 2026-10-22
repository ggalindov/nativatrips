package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.CausalReprogramacion;
import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.model.SolicitudReprogramacion;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SolicitudReprogramacionResponse(
        UUID id,
        String codigoReserva,
        String titular,
        int personas,
        CausalReprogramacion causal,
        String descripcion,
        LocalDate fechaOriginal,
        LocalDate fechaDeseada,
        String soporteTipo,
        EstadoSolicitudReprogramacion estado,
        String motivoDecision,
        Instant creadaEn) {

    public static SolicitudReprogramacionResponse from(
            SolicitudReprogramacion s, String codigoReserva, String titular, int personas) {
        return new SolicitudReprogramacionResponse(
                s.getId(), codigoReserva, titular, personas, s.getCausal(), s.getDescripcion(), s.getFechaOriginal(),
                s.getFechaDeseada(), s.getSoporteTipo(), s.getEstado(), s.getMotivoDecision(), s.getCreatedAt());
    }
}
