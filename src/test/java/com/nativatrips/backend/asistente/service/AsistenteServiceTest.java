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
import com.nativatrips.backend.asistente.dto.Derivacion;
import com.nativatrips.backend.asistente.dto.ReservaSugerida;
import com.nativatrips.backend.asistente.dto.MensajeChat;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import java.util.List;
import java.util.Map;
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
        asistenteService = new AsistenteService(anthropicClient, tools, "reservas@ecopalacio.co", " ");
        org.mockito.Mockito.lenient().when(tools.definiciones()).thenReturn(List.of());
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
        var response = asistenteService.conversar(request);

        assertThat(response.contenido()).isEqualTo("Hola! En que te puedo ayudar?");
        assertThat(response.rol()).isEqualTo("assistant");
    }

    @Test
    void ejecutaLaHerramientaYReenviaElResultadoAntesDeResponder() {
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
        given(tools.ejecutarConEfectos(eq("buscar_senderos"), anyMap()))
                .willReturn(new AsistenteTools.Resultado("[{\"nombre\":\"Piedras Gordas\"}]", null, null));

        var request = new ChatRequest(List.of(new MensajeChat("user", "Que senderos hay?")));
        var response = asistenteService.conversar(request);

        assertThat(response.contenido()).isEqualTo("Tenemos el sendero Piedras Gordas disponible.");
        verify(tools).ejecutarConEfectos(eq("buscar_senderos"), anyMap());
        assertThat(response.reserva()).isNull();
        assertThat(response.derivacion()).isNull();
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
        given(tools.ejecutarConEfectos(any(), any())).willReturn(new AsistenteTools.Resultado("[]", null, null));

        var request = new ChatRequest(List.of(new MensajeChat("user", "Hola")));

        assertThatThrownBy(() -> asistenteService.conversar(request))
                .isInstanceOf(BusinessRuleException.class);
    }
    private AnthropicResponse pideHerramienta(String nombre, Map<String, Object> input) {
        return new AnthropicResponse(
                "msg_1", "assistant",
                List.of(new ContentBlock("tool_use", null, "toolu_1", nombre, input, null, null)),
                "tool_use",
                new AnthropicResponse.Usage(20, 10));
    }

    private AnthropicResponse texto(String contenido) {
        return new AnthropicResponse(
                "msg_2", "assistant", List.of(ContentBlock.texto(contenido)), "end_turn", new AnthropicResponse.Usage(30, 15));
    }

    @Test
    void laReservaPreparadaLlegaEnLaRespuestaParaMostrarElBoton() {
        var sugerida = new ReservaSugerida(3L, "Lagunas de Siecha", "2026-11-28");
        given(anthropicClient.enviarMensaje(anyString(), anyList(), anyList()))
                .willReturn(pideHerramienta("preparar_reserva", Map.of("senderoId", 3, "fecha", "2026-11-28")))
                .willReturn(texto("Listo, abre el formulario con el boton."));
        given(tools.ejecutarConEfectos(eq("preparar_reserva"), anyMap()))
                .willReturn(new AsistenteTools.Resultado("{\"listo\":true}", sugerida, null));

        var response = asistenteService.conversar(new ChatRequest(List.of(new MensajeChat("user", "Quiero reservar Siecha el 28"))));

        assertThat(response.reserva()).isEqualTo(sugerida);
        assertThat(response.derivacion()).isNull();
    }

    @Test
    void laDerivacionLlevaElContactoConfiguradoYOmiteLosVacios() {
        given(anthropicClient.enviarMensaje(anyString(), anyList(), anyList()))
                .willReturn(pideHerramienta("derivar_a_persona", Map.of("motivo", "PIDE_PERSONA")))
                .willReturn(texto("Te dejo el contacto del equipo."));
        given(tools.ejecutarConEfectos(eq("derivar_a_persona"), anyMap()))
                .willReturn(new AsistenteTools.Resultado("{\"listo\":true}", null, Derivacion.PIDE_PERSONA));

        var response = asistenteService.conversar(new ChatRequest(List.of(new MensajeChat("user", "Quiero hablar con alguien"))));

        assertThat(response.derivacion()).isEqualTo(new Derivacion(Derivacion.PIDE_PERSONA, "reservas@ecopalacio.co", null));
        assertThat(response.reserva()).isNull();
    }
}
