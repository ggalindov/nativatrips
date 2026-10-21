package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.config.WompiProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

/** Consulta de transacciones en la API de Wompi con la llave privada (solo lectura). */
@Component
public class ClienteWompi {

    private final RestClient restClient;
    private final WompiProperties propiedades;

    public ClienteWompi(RestClient.Builder restClientBuilder, WompiProperties propiedades) {
        this.propiedades = propiedades;
        this.restClient = restClientBuilder.baseUrl(propiedades.getUrlApi()).build();
    }

    public record Transaccion(String id, String referencia, String estado, BigDecimal monto, String moneda, String cruda) {
    }

    public boolean puedeConsultar() {
        return propiedades.getLlavePrivada() != null && !propiedades.getLlavePrivada().isBlank();
    }

    /** @throws org.springframework.web.client.RestClientException si Wompi no responde o responde error. */
    public List<Transaccion> transaccionesPorReferencia(String referencia) {
        JsonNode respuesta = restClient.get()
                .uri(uri -> uri.path("/transactions").queryParam("reference", referencia).build())
                .header("Authorization", "Bearer " + propiedades.getLlavePrivada())
                .retrieve()
                .body(JsonNode.class);

        List<Transaccion> transacciones = new ArrayList<>();
        if (respuesta != null) {
            for (JsonNode t : respuesta.path("data")) {
                transacciones.add(new Transaccion(
                        t.path("id").asString(),
                        t.path("reference").asString(),
                        t.path("status").asString(),
                        BigDecimal.valueOf(t.path("amount_in_cents").asLong()).movePointLeft(2),
                        t.path("currency").asString(),
                        t.toString()));
            }
        }
        return transacciones;
    }
}
