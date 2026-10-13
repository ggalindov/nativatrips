package com.nativatrips.backend.asistente.service;

import com.nativatrips.backend.asistente.dto.AnthropicResponse;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.AnthropicProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Envoltorio delgado sobre la Messages API de Anthropic (POST /v1/messages). */
@Component
public class AnthropicClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);

    private final RestClient restClient;
    private final AnthropicProperties properties;

    public AnthropicClient(RestClient.Builder restClientBuilder, AnthropicProperties properties) {
        this.properties = properties;
        this.restClient = restClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("anthropic-version", properties.getApiVersion())
                .defaultHeader("content-type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public AnthropicResponse enviarMensaje(String systemPrompt, List<Map<String, Object>> messages, List<Map<String, Object>> tools) {
        if (!properties.isConfigurado()) {
            throw new BusinessRuleException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "El asistente no esta configurado: falta ANTHROPIC_API_KEY");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("max_tokens", properties.getMaxTokens());
        body.put("system", systemPrompt);
        body.put("messages", messages);
        if (tools != null && !tools.isEmpty()) {
            body.put("tools", tools);
        }

        try {
            return restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", properties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(AnthropicResponse.class);
        } catch (RestClientException ex) {
            log.error("Error llamando a la API de Anthropic", ex);
            throw new BusinessRuleException(
                    HttpStatus.BAD_GATEWAY, "El asistente no esta disponible en este momento, intenta de nuevo");
        }
    }
}
