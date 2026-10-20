package com.nativatrips.backend.common.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String codigo;
    private final Map<String, Object> detalles;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null, null);
    }

    /**
     * @param codigo identificador estable del error, para que el frontend lo traduzca a cada idioma.
     * @param detalles datos que el frontend necesita para el texto (por ejemplo, cupos que quedan).
     */
    public ApiException(HttpStatus status, String message, String codigo, Map<String, Object> detalles) {
        super(message);
        this.status = status;
        this.codigo = codigo;
        this.detalles = detalles;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCodigo() {
        return codigo;
    }

    public Map<String, Object> getDetalles() {
        return detalles;
    }
}
