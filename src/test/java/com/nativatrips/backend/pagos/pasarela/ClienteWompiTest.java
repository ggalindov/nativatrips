package com.nativatrips.backend.pagos.pasarela;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.nativatrips.backend.config.WompiProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

class ClienteWompiTest {

    @Test
    void consultaLasTransaccionesDeUnaReferenciaConLaLlavePrivada() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ClienteWompi cliente = new ClienteWompi(builder, propiedades());

        server.expect(requestTo("https://sandbox.wompi.co/v1/transactions?reference=NT-7Q4KX2-ABC"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header("Authorization", "Bearer prv_test_llave"))
                .andRespond(withSuccess("""
                        {"data": [{"id": "1234-1610641025-49201", "reference": "NT-7Q4KX2-ABC", "status": "APPROVED",
                                   "amount_in_cents": 4490000, "currency": "COP"}]}
                        """, MediaType.APPLICATION_JSON));

        var transacciones = cliente.transaccionesPorReferencia("NT-7Q4KX2-ABC");

        assertThat(transacciones).hasSize(1);
        assertThat(transacciones.get(0).estado()).isEqualTo("APPROVED");
        assertThat(transacciones.get(0).monto()).isEqualByComparingTo("44900");
        server.verify();
    }

    @Test
    void unErrorDeWompiSePropagaParaReintentarLuego() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ClienteWompi cliente = new ClienteWompi(builder, propiedades());
        server.expect(requestTo("https://sandbox.wompi.co/v1/transactions?reference=REF")).andRespond(withServerError());

        assertThatThrownBy(() -> cliente.transaccionesPorReferencia("REF")).isInstanceOf(RestClientException.class);
    }

    private static WompiProperties propiedades() {
        WompiProperties propiedades = new WompiProperties();
        propiedades.setLlavePrivada("prv_test_llave");
        return propiedades;
    }
}
