package com.nativatrips.backend.asistente.service;

import com.nativatrips.backend.asistente.dto.AnthropicResponse;
import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.dto.ContentBlock;
import com.nativatrips.backend.asistente.dto.Derivacion;
import com.nativatrips.backend.asistente.dto.MensajeChat;
import com.nativatrips.backend.asistente.dto.ReservaSugerida;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Orquesta la conversacion: llama a Claude, y si pide usar una herramienta, la ejecuta contra
 * el backend real y le reenvia el resultado hasta obtener una respuesta de texto final. Si en el
 * camino preparo una reserva (RF-20) o derivo a una persona (RF-22), la respuesta lo lleva para
 * que el portal muestre el boton o el contacto.
 */
@Service
public class AsistenteService {

    private static final int MAX_ITERACIONES_TOOLS = 5;

    private static final String SYSTEM_PROMPT = """
            Eres el asistente virtual de NativaTrips, la plataforma de reservas de ecoturismo de
            ECOPALACIO CHINGAZA. Ayudas a los turistas a conocer el catalogo de senderos y consultar
            disponibilidad de cupos. Usa siempre las herramientas disponibles para responder con
            datos reales; nunca inventes precios, cupos, fechas o estados de reserva. Si te preguntan
            por una reserva, explica que se consulta y gestiona desde el enlace que llego al correo
            del titular. Cuando el visitante quiera reservar un sendero concreto, usa
            preparar_reserva para que vea el boton del formulario; no pidas sus datos personales por
            el chat. Si pide hablar con una persona, o si no puedes resolver lo que pregunta con tus
            herramientas, usa derivar_a_persona y dile que el portal le muestra como contactar al
            equipo. Responde en el mismo idioma en que te escribe el visitante (espanol, ingles,
            frances o portugues), de forma breve y cordial. Si te preguntan algo fuera de senderos,
            reservas o el funcionamiento de la plataforma, indica amablemente que no puedes ayudar
            con eso.
            """;

    private final AnthropicClient anthropicClient;
    private final AsistenteTools tools;
    private final String correoContacto;
    private final String whatsappContacto;

    public AsistenteService(
            AnthropicClient anthropicClient,
            AsistenteTools tools,
            @Value("${app.asistente.contacto-correo:}") String correoContacto,
            @Value("${app.asistente.contacto-whatsapp:}") String whatsappContacto) {
        this.anthropicClient = anthropicClient;
        this.tools = tools;
        this.correoContacto = vacioANulo(correoContacto);
        this.whatsappContacto = vacioANulo(whatsappContacto);
    }

    public ChatResponse conversar(ChatRequest request) {
        List<Map<String, Object>> messages = new ArrayList<>();
        for (MensajeChat mensaje : request.mensajes()) {
            messages.add(Map.of("role", mensaje.rol(), "content", mensaje.contenido()));
        }

        List<Map<String, Object>> definicionesTools = tools.definiciones();
        Efectos efectos = new Efectos();

        for (int intento = 0; intento < MAX_ITERACIONES_TOOLS; intento++) {
            AnthropicResponse respuesta = anthropicClient.enviarMensaje(SYSTEM_PROMPT, messages, definicionesTools);

            if (!"tool_use".equals(respuesta.stopReason())) {
                Derivacion derivacion = efectos.motivoDerivacion == null
                        ? null
                        : new Derivacion(efectos.motivoDerivacion, correoContacto, whatsappContacto);
                return ChatResponse.deAsistente(extraerTexto(respuesta), efectos.reserva, derivacion);
            }

            messages.add(Map.of("role", "assistant", "content", aBloquesDeSolicitud(respuesta.content())));
            messages.add(Map.of("role", "user", "content", ejecutarTools(respuesta.content(), efectos)));
        }

        throw new BusinessRuleException(
                HttpStatus.BAD_GATEWAY, "El asistente no pudo completar la respuesta, intenta de nuevo");
    }

    /** Lo que las herramientas dejaron para el visitante a lo largo del turno; gana lo ultimo. */
    private static final class Efectos {
        private ReservaSugerida reserva;
        private String motivoDerivacion;
    }

    private List<Map<String, Object>> ejecutarTools(List<ContentBlock> bloques, Efectos efectos) {
        List<Map<String, Object>> resultados = new ArrayList<>();
        for (ContentBlock bloque : bloques) {
            if ("tool_use".equals(bloque.type())) {
                AsistenteTools.Resultado resultado = tools.ejecutarConEfectos(bloque.name(), bloque.input());
                if (resultado.reserva() != null) {
                    efectos.reserva = resultado.reserva();
                }
                if (resultado.motivoDerivacion() != null) {
                    efectos.motivoDerivacion = resultado.motivoDerivacion();
                }
                resultados.add(Map.of("type", "tool_result", "tool_use_id", bloque.id(), "content", resultado.contenido()));
            }
        }
        return resultados;
    }

    private static String vacioANulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.strip();
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
