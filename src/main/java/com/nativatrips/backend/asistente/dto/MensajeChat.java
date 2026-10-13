package com.nativatrips.backend.asistente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Un turno de la conversacion tal como lo envia/recibe el cliente. El rol solo puede ser
 * "user" o "assistant" — el prompt de sistema lo controla siempre el backend, nunca el cliente,
 * para que nadie pueda sobreescribir las instrucciones del asistente desde el frontend.
 */
public record MensajeChat(
        @NotBlank @Pattern(regexp = "user|assistant") String rol,
        @NotBlank @Size(max = 4000) String contenido) {
}
