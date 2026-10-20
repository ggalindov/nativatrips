package com.nativatrips.backend.common.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> validationErrors,
        String codigo,
        Map<String, Object> detalles) {

    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return of(status, error, message, path, null, null);
    }

    public static ApiErrorResponse of(
            int status, String error, String message, String path, String codigo, Map<String, Object> detalles) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, null, codigo, detalles);
    }

    public static ApiErrorResponse validation(int status, String error, String path, List<String> validationErrors) {
        return new ApiErrorResponse(Instant.now(), status, error, "Error de validacion", path, validationErrors, null, null);
    }
}
