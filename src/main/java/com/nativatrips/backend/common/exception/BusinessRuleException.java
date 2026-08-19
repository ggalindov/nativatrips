package com.nativatrips.backend.common.exception;

import org.springframework.http.HttpStatus;

/** Violacion de una regla de negocio: email duplicado, credenciales invalidas, cupo excedido, etc. */
public class BusinessRuleException extends ApiException {

    public BusinessRuleException(HttpStatus status, String message) {
        super(status, message);
    }
}
