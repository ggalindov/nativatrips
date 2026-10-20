package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.model.EstadoPago;
import java.math.BigDecimal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * ADR-005 punto 3: un evento de Wompi solo se cree si su checksum coincide. Se recalcula con los
 * valores que indica {@code signature.properties}, en ese orden, mas el {@code timestamp} y el
 * secreto de eventos; sin esto cualquiera podria enviar un "pago aprobado" falso.
 */
@Component
public class VerificadorEventosWompi {

    private static final Logger log = LoggerFactory.getLogger(VerificadorEventosWompi.class);
    private static final String TRANSACCION_ACTUALIZADA = "transaction.updated";

    private final WompiProperties propiedades;
    private final ObjectMapper objectMapper;

    public VerificadorEventosWompi(WompiProperties propiedades, ObjectMapper objectMapper) {
        this.propiedades = propiedades;
        this.objectMapper = objectMapper;
    }

    /**
     * @param checksumCabecera valor de {@code X-Event-Checksum}; si llega, tambien debe coincidir.
     * @return el resultado de la transaccion, o vacio si el evento es de otro tipo.
     * @throws BusinessRuleException 401 si la firma no coincide o el evento no se puede leer.
     */
    public Optional<ResultadoPago> verificar(String cuerpo, String checksumCabecera) {
        JsonNode evento = leer(cuerpo);
        JsonNode firma = evento.path("signature");
        String checksum = firma.path("checksum").asString("");
        long timestamp = evento.path("timestamp").asLong(-1);
        if (timestamp < 0 || !firma.path("properties").isArray() || propiedades.getSecretoEventos() == null) {
            throw firmaInvalida("evento sin firma o sin secreto de eventos configurado");
        }

        StringBuilder valores = new StringBuilder();
        for (JsonNode propiedad : firma.path("properties")) {
            JsonNode valor = evento.path("data").at("/" + propiedad.asString().replace('.', '/'));
            if (valor.isMissingNode() || valor.isNull()) {
                throw firmaInvalida("la propiedad firmada " + propiedad.asString() + " no viene en el evento");
            }
            valores.append(valor.asString());
        }
        String esperado = FirmasWompi.checksumEvento(valores.toString(), timestamp, propiedades.getSecretoEventos());
        if (!FirmasWompi.coinciden(esperado, checksum)
                || (checksumCabecera != null && !FirmasWompi.coinciden(esperado, checksumCabecera))) {
            throw firmaInvalida("el checksum no coincide");
        }

        if (!TRANSACCION_ACTUALIZADA.equals(evento.path("event").asString())) {
            return Optional.empty();
        }
        JsonNode transaccion = evento.path("data").path("transaction");
        String estadoWompi = transaccion.path("status").asString();
        return Optional.of(new ResultadoPago(
                transaccion.path("reference").asString(),
                transaccion.path("id").asString(),
                mapearEstado(estadoWompi),
                BigDecimal.valueOf(transaccion.path("amount_in_cents").asLong()).movePointLeft(2),
                transaccion.path("currency").asString(),
                "Evento de Wompi (status=" + estadoWompi + ", metodo=" + transaccion.path("payment_method_type").asString("") + ")",
                cuerpo));
    }

    private JsonNode leer(String cuerpo) {
        try {
            return objectMapper.readTree(cuerpo == null ? "" : cuerpo);
        } catch (JacksonException ex) {
            throw firmaInvalida("el evento no es un JSON valido");
        }
    }

    /** VOIDED (anulada) y ERROR no mueven la reserva: se registran y se espera otro evento o la conciliacion. */
    static EstadoPago mapearEstado(String estadoWompi) {
        return switch (estadoWompi) {
            case "APPROVED" -> EstadoPago.APROBADO;
            case "DECLINED" -> EstadoPago.RECHAZADO;
            case "PENDING" -> EstadoPago.PENDIENTE;
            default -> EstadoPago.ERROR;
        };
    }

    private static BusinessRuleException firmaInvalida(String motivo) {
        log.warn("Evento de Wompi rechazado: {}", motivo);
        return new BusinessRuleException(HttpStatus.UNAUTHORIZED, "Evento de Wompi con firma invalida");
    }
}
