package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.AnthropicProperties;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AnthropicClientTest {

    private AnthropicProperties propiedades() {
        AnthropicProperties properties = new AnthropicProperties();
        properties.setApiKey("sk-ant-test-key");
        properties.setModel("claude-haiku-4-5");
        properties.setBaseUrl("https://api.anthropic.com");
        properties.setApiVersion("2023-06-01");
        properties.setMaxTokens(1024);
        return properties;
    }

    @Test
    void envolviendoUnErrorSiNoHayApiKeyConfigurada() {
        AnthropicProperties properties = propiedades();
        properties.setApiKey("");
        RestClient.Builder builder = RestClient.builder();
        AnthropicClient client = new AnthropicClient(builder, properties);

        assertThatThrownBy(() -> client.enviarMensaje("system", List.of(), List.of()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("ANTHROPIC_API_KEY");
    }

    @Test
    void enviaLaSolicitudConLosHeadersYCuerpoCorrectosYParseaLaRespuesta() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AnthropicClient client = new AnthropicClient(builder, propiedades());

        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-api-key", "sk-ant-test-key"))
                .andExpect(header("anthropic-version", "2023-06-01"))
                .andExpect(jsonPath("$.model").value("claude-haiku-4-5"))
                .andExpect(jsonPath("$.system").value("Eres el asistente de NativaTrips"))
                .andExpect(jsonPath("$.messages[0].role").value("user"))
                .andRespond(withSuccess("""
                        {
                            "id": "msg_1",
                            "role": "assistant",
                            "content": [{"type": "text", "text": "Hola, en que te ayudo?"}],
                            "stop_reason": "end_turn",
                            "usage": {"input_tokens": 10, "output_tokens": 5}
                        }
                        """, MediaType.APPLICATION_JSON));

        var respuesta = client.enviarMensaje(
                "Eres el asistente de NativaTrips",
                List.of(Map.of("role", "user", "content", "Hola")),
                List.of());

        assertThat(respuesta.stopReason()).isEqualTo("end_turn");
        assertThat(respuesta.content()).hasSize(1);
        assertThat(respuesta.content().get(0).text()).isEqualTo("Hola, en que te ayudo?");
        server.verify();
    }

    @Test
    void envuelveErroresDeLaApiComoBusinessRuleException() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        AnthropicClient client = new AnthropicClient(builder, propiedades());

        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> client.enviarMensaje("system", List.of(Map.of("role", "user", "content", "Hola")), List.of()))
                .isInstanceOf(BusinessRuleException.class);
    }
}
