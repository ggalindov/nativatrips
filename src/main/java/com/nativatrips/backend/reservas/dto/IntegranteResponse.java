package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.ReservaIntegrante;

public record IntegranteResponse(String nombreCompleto, String documentoIdentidad) {

    public static IntegranteResponse from(ReservaIntegrante integrante) {
        return new IntegranteResponse(integrante.getNombreCompleto(), integrante.getDocumentoIdentidad());
    }
}
