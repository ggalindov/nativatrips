package com.nativatrips.backend.common.dto;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<String> validationErrors) {

    public static ApiErrorResponse of(int status, String error, String message, String path) {
        return new ApiErrorResponse(Instant.now(), status, error, message, path, null);
    }

    public static ApiErrorResponse validation(int status, String error, String path, List<String> validationErrors) {
        return new ApiErrorResponse(Instant.now(), status, error, "Error de validacion", path, validationErrors);
    }
}
