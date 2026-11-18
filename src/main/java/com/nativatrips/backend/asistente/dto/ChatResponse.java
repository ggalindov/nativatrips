package com.nativatrips.backend.asistente.dto;

/**
 * Respuesta del asistente. {@code reserva} y {@code derivacion} solo llegan cuando el modelo
 * uso la herramienta correspondiente en este turno.
 */
public record ChatResponse(String rol, String contenido, ReservaSugerida reserva, Derivacion derivacion) {

    public static ChatResponse deAsistente(String contenido) {
        return new ChatResponse("assistant", contenido, null, null);
    }

    public static ChatResponse deAsistente(String contenido, ReservaSugerida reserva, Derivacion derivacion) {
        return new ChatResponse("assistant", contenido, reserva, derivacion);
    }
}
