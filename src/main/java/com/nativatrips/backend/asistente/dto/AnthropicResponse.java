package com.nativatrips.backend.asistente.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AnthropicResponse(
        String id,
        String role,
        List<ContentBlock> content,
        @JsonProperty("stop_reason") String stopReason,
        Usage usage) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Usage(
            @JsonProperty("input_tokens") int inputTokens, @JsonProperty("output_tokens") int outputTokens) {
    }
}
