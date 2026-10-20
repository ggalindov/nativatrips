package com.nativatrips.backend.common.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

/** Violacion de una regla de negocio: email duplicado, credenciales invalidas, cupo excedido, etc. */
public class BusinessRuleException extends ApiException {

    public BusinessRuleException(HttpStatus status, String message) {
        super(status, message);
    }

    public BusinessRuleException(HttpStatus status, String message, String codigo, Map<String, Object> detalles) {
        super(status, message, codigo, detalles);
    }
}
