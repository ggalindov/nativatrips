package com.nativatrips.backend.asistente.service;

import com.nativatrips.backend.asistente.dto.Derivacion;
import com.nativatrips.backend.asistente.dto.ReservaSugerida;
import com.nativatrips.backend.common.exception.ApiException;
import com.nativatrips.backend.reservas.dto.MiReservaResponse;
import com.nativatrips.backend.reservas.service.MiReservaService;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.service.SenderoService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * Herramientas que el asistente puede invocar, siempre respaldadas por datos reales del backend
 * (nunca inventadas por el modelo). Las publicas leen catalogo y cupos. La unica que lee una reserva
 * es consultar_mi_reserva, y solo existe en la conversacion cuando el visitante tiene abierto el
 * enlace de su reserva (ADR-004): usa ese enlace, valida igual que «mi reserva» y no puede pedir
 * datos de otra persona aunque el texto del chat lo intente. Preparar una reserva tampoco la crea:
 * solo lleva al visitante al formulario con el sendero elegido.
 */
@Component
public class AsistenteTools {

    private static final Logger log = LoggerFactory.getLogger(AsistenteTools.class);

    static final String BUSCAR_SENDEROS = "buscar_senderos";
    static final String CONSULTAR_DISPONIBILIDAD = "consultar_disponibilidad";
    static final String PREPARAR_RESERVA = "preparar_reserva";
    static final String DERIVAR_A_PERSONA = "derivar_a_persona";
    static final String CONSULTAR_MI_RESERVA = "consultar_mi_reserva";

    /**
     * Datos de la peticion que el modelo nunca ve ni puede cambiar.
     *
     * @param enlaceReserva token del enlace de la reserva que el visitante tiene abierto, o null
     */
    public record Contexto(String enlaceReserva, String ip) {

        public static final Contexto VACIO = new Contexto(null, null);

        public boolean conReserva() {
            return enlaceReserva != null && !enlaceReserva.isBlank();
        }
    }

    /** Lo que deja una herramienta: el texto para el modelo y, si aplica, lo que ve el visitante. */
    public record Resultado(String contenido, ReservaSugerida reserva, String motivoDerivacion) {

        static Resultado soloTexto(String contenido) {
            return new Resultado(contenido, null, null);
        }
    }

    private final SenderoService senderoService;
    private final ReservaService reservaService;
    private final MiReservaService miReservaService;
    private final ObjectMapper objectMapper;
    private final Clock reloj;

    public AsistenteTools(
            SenderoService senderoService,
            ReservaService reservaService,
            MiReservaService miReservaService,
            ObjectMapper objectMapper,
            Clock reloj) {
        this.senderoService = senderoService;
        this.reservaService = reservaService;
        this.miReservaService = miReservaService;
        this.objectMapper = objectMapper;
        this.reloj = reloj;
    }

    /** Herramientas para un visitante sin el enlace de su reserva. */
    public List<Map<String, Object>> definiciones() {
        return definiciones(Contexto.VACIO);
    }

    /** Con el enlace de la reserva abierto se suma consultar_mi_reserva; sin el, no existe. */
    public List<Map<String, Object>> definiciones(Contexto contexto) {
        List<Map<String, Object>> definiciones = new ArrayList<>(publicas());
        if (contexto.conReserva()) {
            definiciones.add(Map.of(
                    "name", CONSULTAR_MI_RESERVA,
                    "description", "Devuelve la reserva que el visitante tiene abierta con su enlace: codigo, sendero, "
                            + "fecha, hora de salida, punto de encuentro, personas, estado, guia y solicitud de cambio "
                            + "de fecha. Es la unica reserva a la que tienes acceso.",
                    "input_schema", Map.of("type", "object", "properties", Map.of(), "required", List.of())));
        }
        return definiciones;
    }

    private List<Map<String, Object>> publicas() {
        return List.of(
                Map.of(
                        "name", BUSCAR_SENDEROS,
                        "description", "Devuelve el catalogo de senderos ecoturisticos activos: nombre, "
                                + "nivel de dificultad, duracion, precio y descripcion.",
                        "input_schema", Map.of("type", "object", "properties", Map.of(), "required", List.of())),
                Map.of(
                        "name", CONSULTAR_DISPONIBILIDAD,
                        "description", "Consulta el cupo disponible de un sendero para una fecha especifica.",
                        "input_schema", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "senderoId", Map.of("type", "integer", "description", "ID del sendero"),
                                        "fecha", Map.of("type", "string", "description", "Fecha en formato YYYY-MM-DD")),
                                "required", List.of("senderoId", "fecha"))),
                Map.of(
                        "name", PREPARAR_RESERVA,
                        "description", "Usala cuando el visitante quiera reservar un sendero concreto. Le muestra "
                                + "un boton que abre el formulario de reserva con ese sendero y, si la dio, esa fecha. "
                                + "No crea la reserva ni cobra: el visitante completa sus datos en el formulario.",
                        "input_schema", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "senderoId", Map.of("type", "integer", "description", "ID del sendero"),
                                        "fecha", Map.of("type", "string",
                                                "description", "Fecha deseada en formato YYYY-MM-DD, si el visitante la dio")),
                                "required", List.of("senderoId"))),
                Map.of(
                        "name", DERIVAR_A_PERSONA,
                        "description", "Usala cuando el visitante pida hablar con una persona (motivo PIDE_PERSONA) "
                                + "o cuando no puedas resolver su consulta con tus herramientas (motivo NO_RESUELTO). "
                                + "El portal le mostrara como contactar al equipo.",
                        "input_schema", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "motivo", Map.of("type", "string",
                                                "enum", List.of(Derivacion.PIDE_PERSONA, Derivacion.NO_RESUELTO))),
                                "required", List.of("motivo"))));
    }

    /** Ejecuta la herramienta y devuelve solo el texto para el modelo. */
    public String ejecutar(String nombreTool, Map<String, Object> input) {
        return ejecutarConEfectos(nombreTool, input, Contexto.VACIO).contenido();
    }

    public Resultado ejecutarConEfectos(String nombreTool, Map<String, Object> input, Contexto contexto) {
        try {
            return switch (nombreTool) {
                case BUSCAR_SENDEROS -> Resultado.soloTexto(aJson(senderoService.listarActivos()));
                case CONSULTAR_DISPONIBILIDAD -> Resultado.soloTexto(aJson(
                        reservaService.obtenerDisponibilidad(obtenerSenderoId(input), obtenerFecha(input))));
                case PREPARAR_RESERVA -> prepararReserva(input);
                case DERIVAR_A_PERSONA -> derivar(input);
                case CONSULTAR_MI_RESERVA -> consultarMiReserva(contexto);
                default -> Resultado.soloTexto(aJson(Map.of("error", "Herramienta desconocida: " + nombreTool)));
            };
        } catch (ApiException ex) {
            return Resultado.soloTexto(aJson(Map.of("error", ex.getMessage())));
        } catch (Exception ex) {
            log.error("Error ejecutando la herramienta {}", nombreTool, ex);
            return Resultado.soloTexto(aJson(Map.of("error", "No se pudo completar la consulta")));
        }
    }

    private Resultado prepararReserva(Map<String, Object> input) {
        // obtener() solo devuelve senderos publicados y activos: un borrador no se puede reservar.
        SenderoResponse sendero = senderoService.obtener(obtenerSenderoId(input));
        String fecha = null;
        Object fechaPedida = input.get("fecha");
        if (fechaPedida instanceof String texto && !texto.isBlank()) {
            LocalDate dia;
            try {
                dia = LocalDate.parse(texto);
            } catch (DateTimeParseException ex) {
                return Resultado.soloTexto(aJson(Map.of("error", "La fecha debe tener el formato YYYY-MM-DD")));
            }
            if (dia.isBefore(LocalDate.now(reloj))) {
                return Resultado.soloTexto(aJson(Map.of("error", "La fecha ya paso; pide otra al visitante")));
            }
            fecha = dia.toString();
        }
        ReservaSugerida reserva = new ReservaSugerida(sendero.id(), sendero.nombre(), fecha);
        return new Resultado(
                aJson(Map.of("listo", true, "mensaje", "El visitante vera un boton para abrir el formulario de reserva.")),
                reserva,
                null);
    }

    private Resultado derivar(Map<String, Object> input) {
        String motivo = Derivacion.PIDE_PERSONA.equals(input.get("motivo")) ? Derivacion.PIDE_PERSONA : Derivacion.NO_RESUELTO;
        return new Resultado(
                aJson(Map.of("listo", true, "mensaje", "El visitante vera como contactar al equipo.")),
                null,
                motivo);
    }

    /**
     * Resumen de la reserva del enlace. No incluye documentos, celular ni correo del titular, ni los
     * datos de los acompanantes: el asistente no los necesita para responder.
     */
    private Resultado consultarMiReserva(Contexto contexto) {
        if (!contexto.conReserva()) {
            return Resultado.soloTexto(aJson(Map.of("error",
                    "Sin el enlace de la reserva no hay acceso a reservas; se consulta desde el enlace del correo")));
        }
        MiReservaResponse reserva = miReservaService.consultar(contexto.enlaceReserva(), contexto.ip());
        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("codigo", reserva.codigo());
        resumen.put("sendero", reserva.senderoNombre());
        resumen.put("fecha", String.valueOf(reserva.fecha()));
        resumen.put("horaSalida", String.valueOf(reserva.horaSalida()));
        resumen.put("puntoEncuentro", reserva.puntoEncuentro());
        resumen.put("personas", reserva.personas());
        resumen.put("acompanantesRegistrados", reserva.acompanantes() == null ? 0 : reserva.acompanantes().size());
        resumen.put("estado", String.valueOf(reserva.estado()));
        resumen.put("guia", reserva.guia());
        if (reserva.reprogramacion() != null) {
            resumen.put("cambioDeFecha", Map.of(
                    "fechaDeseada", String.valueOf(reserva.reprogramacion().fechaDeseada()),
                    "estado", String.valueOf(reserva.reprogramacion().estado())));
        }
        return Resultado.soloTexto(aJson(resumen));
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
