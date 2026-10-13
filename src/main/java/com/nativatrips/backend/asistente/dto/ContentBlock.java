package com.nativatrips.backend.asistente.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

/**
 * Un bloque de contenido de la Messages API de Anthropic. Segun "type" solo algunos campos
 * aplican: text (type=text), id/name/input (type=tool_use), toolUseId/content (type=tool_result).
 * Se modela como un unico record con campos nulos en vez de una jerarquia porque Jackson no
 * necesita polimorfismo para leer/escribir esta forma flexible.
 */
public record ContentBlock(
        String type,
        String text,
        String id,
        String name,
        Map<String, Object> input,
        @JsonProperty("tool_use_id") String toolUseId,
        Object content) {

    public static ContentBlock texto(String texto) {
        return new ContentBlock("text", texto, null, null, null, null, null);
    }

    public static ContentBlock toolResult(String toolUseId, String resultado) {
        return new ContentBlock("tool_result", null, null, null, null, toolUseId, resultado);
    }
}
