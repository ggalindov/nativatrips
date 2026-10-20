package com.nativatrips.backend.asistente.service;

import com.nativatrips.backend.asistente.dto.AnthropicResponse;
import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.dto.ContentBlock;
import com.nativatrips.backend.asistente.dto.MensajeChat;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Orquesta la conversacion: llama a Claude, y si pide usar una herramienta, la ejecuta contra
 * el backend real y le reenvia el resultado hasta obtener una respuesta de texto final.
 */
@Service
public class AsistenteService {

    private static final int MAX_ITERACIONES_TOOLS = 5;

    private static final String SYSTEM_PROMPT = """
            Eres el asistente virtual de NativaTrips, la plataforma de reservas de ecoturismo de
            ECOPALACIO CHINGAZA. Ayudas a los turistas a conocer el catalogo de senderos, consultar
            disponibilidad de cupos y revisar el estado de sus propias reservas. Usa siempre las
            herramientas disponibles para responder con datos reales; nunca inventes precios, cupos,
            fechas o estados de reserva. Si te preguntan por una reserva y no tienes la herramienta
            para consultarla, explica que se gestiona desde el enlace que llego al correo del
            titular. Responde en espanol, de forma breve y cordial. Si te
            preguntan algo fuera de senderos, reservas o el funcionamiento de la plataforma, indica
            amablemente que no puedes ayudar con eso.
            """;

    private final AnthropicClient anthropicClient;
    private final AsistenteTools tools;

    public AsistenteService(AnthropicClient anthropicClient, AsistenteTools tools) {
        this.anthropicClient = anthropicClient;
        this.tools = tools;
    }

    /** @param turistaId null cuando conversa un visitante sin sesion (BUG-04). */
    public ChatResponse conversar(ChatRequest request, UUID turistaId) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (MensajeChat mensaje : request.mensajes()) {
            messages.add(Map.of("role", mensaje.rol(), "content", mensaje.contenido()));
        }

        List<Map<String, Object>> definicionesTools = tools.definiciones(turistaId != null);

        for (int intento = 0; intento < MAX_ITERACIONES_TOOLS; intento++) {
            AnthropicResponse respuesta = anthropicClient.enviarMensaje(SYSTEM_PROMPT, messages, definicionesTools);

            if (!"tool_use".equals(respuesta.stopReason())) {
                return ChatResponse.deAsistente(extraerTexto(respuesta));
            }

            messages.add(Map.of("role", "assistant", "content", aBloquesDeSolicitud(respuesta.content())));
            messages.add(Map.of("role", "user", "content", ejecutarTools(respuesta.content(), turistaId)));
        }

        throw new BusinessRuleException(
                HttpStatus.BAD_GATEWAY, "El asistente no pudo completar la respuesta, intenta de nuevo");
    }

    private List<Map<String, Object>> ejecutarTools(List<ContentBlock> bloques, UUID turistaId) {
        List<Map<String, Object>> resultados = new ArrayList<>();
        for (ContentBlock bloque : bloques) {
            if ("tool_use".equals(bloque.type())) {
                String resultado = tools.ejecutar(bloque.name(), bloque.input(), turistaId);
                resultados.add(Map.of("type", "tool_result", "tool_use_id", bloque.id(), "content", resultado));
            }
        }
        return resultados;
    }

    private String extraerTexto(AnthropicResponse respuesta) {
        return respuesta.content().stream()
                .filter(b -> "text".equals(b.type()))
                .map(ContentBlock::text)
                .collect(Collectors.joining("\n"))
                .strip();
    }

    /** Reconstruye los bloques de la respuesta de Claude en la forma exacta que espera la API al reenviarlos. */
    private List<Map<String, Object>> aBloquesDeSolicitud(List<ContentBlock> content) {
        return content.stream().map(bloque -> {
            Map<String, Object> mapa = new LinkedHashMap<>();
            mapa.put("type", bloque.type());
            if ("text".equals(bloque.type())) {
                mapa.put("text", bloque.text());
            } else if ("tool_use".equals(bloque.type())) {
                mapa.put("id", bloque.id());
                mapa.put("name", bloque.name());
                mapa.put("input", bloque.input());
            }
            return mapa;
        }).toList();
    }
}
