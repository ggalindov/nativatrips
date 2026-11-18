package com.nativatrips.backend.asistente.dto;

/**
 * El visitante quiere reservar (RF-20): el portal le ofrece ir al formulario con el sendero y,
 * si la dio, la fecha ya elegidos. El asistente no crea la reserva ni cobra.
 *
 * @param fecha en formato ISO o {@code null} si el visitante no la dio
 */
public record ReservaSugerida(Long senderoId, String senderoNombre, String fecha) {
}
