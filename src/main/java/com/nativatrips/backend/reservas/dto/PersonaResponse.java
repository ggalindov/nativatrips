package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoDocumento;

public record PersonaResponse(String nombre, TipoDocumento tipoDocumento, String documento, String nacionalidad) {

    public static PersonaResponse from(ReservaIntegrante integrante) {
        return new PersonaResponse(
                integrante.getNombreCompleto(),
                integrante.getTipoDocumento(),
                integrante.getDocumentoIdentidad(),
                integrante.getNacionalidad());
    }
}
