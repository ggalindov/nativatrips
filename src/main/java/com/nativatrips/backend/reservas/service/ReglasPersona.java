package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import org.springframework.http.HttpStatus;

/** Las mismas reglas del formulario del frontend para el titular y los acompanantes. */
final class ReglasPersona {

    private ReglasPersona() {
    }

    /** El documento depende de la nacionalidad; cedula, TI, CE y PPT son solo digitos. */
    static void validarDocumento(TipoDocumento tipo, String documento, String nacionalidad) {
        boolean colombiano = "CO".equals(nacionalidad);
        if (tipo.esNacional() != colombiano) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, colombiano
                    ? "Para colombianos el documento debe ser cedula o tarjeta de identidad"
                    : "Para extranjeros el documento debe ser pasaporte, cedula de extranjeria, PPT o DNI");
        }
        if (!tipo.esAlfanumerico() && !documento.trim().matches("\\d{5,12}")) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "El numero de documento debe tener solo digitos");
        }
    }

    /** Celular colombiano: 10 digitos que empiezan por 3. */
    static void validarCelular(String indicativo, String celular) {
        if ("57".equals(indicativo) && !celular.matches("3\\d{9}")) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "El celular colombiano debe tener 10 digitos y empezar por 3");
        }
    }
}
