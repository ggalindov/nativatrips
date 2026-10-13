package com.nativatrips.backend.asistente.dto;

public record ChatResponse(String rol, String contenido) {

    public static ChatResponse deAsistente(String contenido) {
        return new ChatResponse("assistant", contenido);
    }
}
