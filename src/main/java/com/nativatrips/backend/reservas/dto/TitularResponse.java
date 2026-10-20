package com.nativatrips.backend.reservas.dto;

import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TitularReserva;

public record TitularResponse(
        String nombre,
        TipoDocumento tipoDocumento,
        String documento,
        String nacionalidad,
        String correo,
        String indicativo,
        String celular) {

    public static TitularResponse from(TitularReserva titular) {
        return new TitularResponse(
                titular.getNombre(),
                titular.getTipoDocumento(),
                titular.getDocumento(),
                titular.getNacionalidad(),
                titular.getCorreo(),
                titular.getIndicativo(),
                titular.getCelular());
    }
}
