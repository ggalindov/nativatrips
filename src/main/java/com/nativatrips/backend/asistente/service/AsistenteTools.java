package com.nativatrips.backend.asistente.service;

import com.nativatrips.backend.common.exception.ApiException;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.service.SenderoService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Herramientas que el asistente puede invocar, siempre respaldadas por datos reales del backend
 * (nunca inventadas por el modelo). El turistaId SIEMPRE lo inyecta este componente desde el
 * principal autenticado — nunca se toma de los argumentos que arma el modelo, para que un intento
 * de prompt injection no pueda pedirle al asistente "consulta las reservas del usuario X". Un
 * visitante sin sesion no recibe la herramienta de reservas y, si aun asi la pide, se rechaza.
 */
@Component
public class AsistenteTools {

    private static final Logger log = LoggerFactory.getLogger(AsistenteTools.class);

    private final SenderoService senderoService;
    private final ReservaService reservaService;
    private final ObjectMapper objectMapper;

    public AsistenteTools(SenderoService senderoService, ReservaService reservaService, ObjectMapper objectMapper) {
        this.senderoService = senderoService;
        this.reservaService = reservaService;
        this.objectMapper = objectMapper;
    }

    static final String CONSULTAR_MIS_RESERVAS = "consultar_mis_reservas";

    /** @param conReservas true solo cuando hay un turista identificado en la conversacion. */
    public List<Map<String, Object>> definiciones(boolean conReservas) {
        return todas().stream()
                .filter(definicion -> conReservas || !CONSULTAR_MIS_RESERVAS.equals(definicion.get("name")))
                .toList();
    }

    private static List<Map<String, Object>> todas() {
        return List.of(
                Map.of(
                        "name", "buscar_senderos",
                        "description", "Devuelve el catalogo de senderos ecoturisticos activos: nombre, "
                                + "nivel de dificultad, duracion, precio y descripcion.",
                        "input_schema", Map.of("type", "object", "properties", Map.of(), "required", List.of())),
                Map.of(
                        "name", "consultar_disponibilidad",
                        "description", "Consulta el cupo disponible de un sendero para una fecha especifica.",
                        "input_schema", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "senderoId", Map.of("type", "integer", "description", "ID del sendero"),
                                        "fecha", Map.of("type", "string", "description", "Fecha en formato YYYY-MM-DD")),
                                "required", List.of("senderoId", "fecha"))),
                Map.of(
                        "name", CONSULTAR_MIS_RESERVAS,
                        "description", "Devuelve las reservas del turista que esta conversando, con su estado actual.",
                        "input_schema", Map.of("type", "object", "properties", Map.of(), "required", List.of())));
    }

    public String ejecutar(String nombreTool, Map<String, Object> input, UUID turistaId) {
        try {
            Object resultado = switch (nombreTool) {
                case "buscar_senderos" -> senderoService.listarActivos();
                case "consultar_disponibilidad" -> reservaService.obtenerDisponibilidad(
                        obtenerSenderoId(input), obtenerFecha(input));
                case CONSULTAR_MIS_RESERVAS -> turistaId == null
                        ? Map.of("error", "Para consultar una reserva hay que abrir el enlace que llego al correo")
                        : reservaService.listarMisReservas(turistaId);
                default -> Map.of("error", "Herramienta desconocida: " + nombreTool);
            };
            return aJson(resultado);
        } catch (ApiException ex) {
            return aJson(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("Error ejecutando la herramienta {} con input {}", nombreTool, input, ex);
            return aJson(Map.of("error", "No se pudo completar la consulta"));
        }
    }

    private Long obtenerSenderoId(Map<String, Object> input) {
        return ((Number) input.get("senderoId")).longValue();
    }

    private LocalDate obtenerFecha(Map<String, Object> input) {
        return LocalDate.parse((String) input.get("fecha"));
    }

    private String aJson(Object valor) {
        try {
            return objectMapper.writeValueAsString(valor);
        } catch (JacksonException ex) {
            return "{\"error\": \"No se pudo serializar el resultado\"}";
        }
    }
}
