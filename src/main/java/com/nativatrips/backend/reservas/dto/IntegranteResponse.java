package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import java.util.UUID;

/**
 * Una persona de la reserva. {@code visitasPrevias} (RF-11) solo se calcula para la lista del guia:
 * cuantas salidas anteriores completo el mismo documento; en las demas respuestas vale 0.
 */
public record IntegranteResponse(
        UUID id,
        String nombreCompleto,
        TipoDocumento tipoDocumento,
        String documentoIdentidad,
        String nacionalidad,
        Boolean asistio,
        long visitasPrevias) {

    public static IntegranteResponse from(ReservaIntegrante integrante) {
        return conVisitas(integrante, 0);
    }

    public static IntegranteResponse conVisitas(ReservaIntegrante integrante, long visitasPrevias) {
        return new IntegranteResponse(
                integrante.getId(),
                integrante.getNombreCompleto(),
                integrante.getTipoDocumento(),
                integrante.getDocumentoIdentidad(),
                integrante.getNacionalidad(),
                integrante.getAsistio(),
                visitasPrevias);
    }
}
