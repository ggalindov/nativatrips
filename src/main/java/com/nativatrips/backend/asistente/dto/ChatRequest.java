package com.nativatrips.backend.asistente.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * El cliente reenvia el historial completo de la conversacion en cada request (igual que la
 * propia Messages API de Anthropic, que es stateless) — evita persistir conversaciones en el
 * backend para un MVP donde eso no es un requisito explicito.
 */
public record ChatRequest(@NotEmpty @Size(max = 50) List<@Valid MensajeChat> mensajes) {
}
