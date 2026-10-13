package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.asistente.dto.AnthropicResponse;
import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ContentBlock;
import com.nativatrips.backend.asistente.dto.MensajeChat;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AsistenteServiceTest {

    @Mock
    private AnthropicClient anthropicClient;

    @Mock
    private AsistenteTools tools;

    private AsistenteService asistenteService;

    @BeforeEach
    void setUp() {
        asistenteService = new AsistenteService(anthropicClient, tools);
        given(tools.definiciones()).willReturn(List.of());
    }

    @Test
    void devuelveElTextoDirectamenteCuandoClaudeNoNecesitaHerramientas() {
        given(anthropicClient.enviarMensaje(anyString(), anyList(), anyList())).willReturn(
                new AnthropicResponse(
                        "msg_1", "assistant",
                        List.of(ContentBlock.texto("Hola! En que te puedo ayudar?")),
                        "end_turn",
                        new AnthropicResponse.Usage(10, 5)));

        var request = new ChatRequest(List.of(new MensajeChat("user", "Hola")));
        var response = asistenteService.conversar(request, UUID.randomUUID());

        assertThat(response.contenido()).isEqualTo("Hola! En que te puedo ayudar?");
        assertThat(response.rol()).isEqualTo("assistant");
    }

    @Test
    void ejecutaLaHerramientaYReenviaElResultadoAntesDeResponder() {
        UUID turistaId = UUID.randomUUID();

        AnthropicResponse primeraRespuesta = new AnthropicResponse(
                "msg_1", "assistant",
                List.of(new ContentBlock("tool_use", null, "toolu_1", "buscar_senderos", Map.of(), null, null)),
                "tool_use",
                new AnthropicResponse.Usage(20, 10));

        AnthropicResponse segundaRespuesta = new AnthropicResponse(
                "msg_2", "assistant",
                List.of(ContentBlock.texto("Tenemos el sendero Piedras Gordas disponible.")),
                "end_turn",
                new AnthropicResponse.Usage(30, 15));

        given(anthropicClient.enviarMensaje(anyString(), anyList(), anyList()))
                .willReturn(primeraRespuesta)
                .willReturn(segundaRespuesta);
        given(tools.ejecutar(eq("buscar_senderos"), anyMap(), eq(turistaId)))
                .willReturn("[{\"nombre\":\"Piedras Gordas\"}]");

        var request = new ChatRequest(List.of(new MensajeChat("user", "Que senderos hay?")));
        var response = asistenteService.conversar(request, turistaId);

        assertThat(response.contenido()).isEqualTo("Tenemos el sendero Piedras Gordas disponible.");
        verify(tools).ejecutar(eq("buscar_senderos"), anyMap(), eq(turistaId));
        verify(anthropicClient, times(2)).enviarMensaje(anyString(), anyList(), anyList());
    }

    @Test
    void lanzaErrorSiSuperaElLimiteDeIteracionesDeHerramientas() {
        AnthropicResponse siempreToolUse = new AnthropicResponse(
                "msg_1", "assistant",
                List.of(new ContentBlock("tool_use", null, "toolu_1", "buscar_senderos", Map.of(), null, null)),
                "tool_use",
                new AnthropicResponse.Usage(20, 10));

        given(anthropicClient.enviarMensaje(anyString(), anyList(), anyList())).willReturn(siempreToolUse);
        given(tools.ejecutar(any(), any(), any())).willReturn("[]");

        var request = new ChatRequest(List.of(new MensajeChat("user", "Hola")));

        assertThatThrownBy(() -> asistenteService.conversar(request, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
    }
}
