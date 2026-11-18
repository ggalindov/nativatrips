package com.nativatrips.backend.asistente.dto;

/**
 * El asistente no pudo resolver la consulta o el visitante pidio hablar con alguien (RF-22).
 * Los datos de contacto salen de la configuracion; pueden llegar vacios si no se configuraron.
 *
 * @param motivo {@code PIDE_PERSONA} o {@code NO_RESUELTO}
 */
public record Derivacion(String motivo, String correo, String whatsapp) {

    public static final String PIDE_PERSONA = "PIDE_PERSONA";
    public static final String NO_RESUELTO = "NO_RESUELTO";
}
