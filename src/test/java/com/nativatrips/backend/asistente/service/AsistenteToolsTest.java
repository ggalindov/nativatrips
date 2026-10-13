package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.service.SenderoService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class AsistenteToolsTest {

    @Mock
    private SenderoService senderoService;

    @Mock
    private ReservaService reservaService;

    private AsistenteTools asistenteTools;

    @BeforeEach
    void setUp() {
        asistenteTools = new AsistenteTools(senderoService, reservaService, JsonMapper.builder().build());
    }

    @Test
    void consultarMisReservasUsaSiempreElTuristaIdAutenticadoNoUnoQueVengaEnElInput() {
        UUID turistaAutenticado = UUID.randomUUID();
        UUID otroTuristaSugeridoPorElModelo = UUID.randomUUID();
        given(reservaService.listarMisReservas(turistaAutenticado)).willReturn(List.of());

        // El modelo podria intentar inyectar un turistaId ajeno en el input; la tool lo ignora.
        Map<String, Object> inputManipulado = Map.of("turistaId", otroTuristaSugeridoPorElModelo.toString());

        asistenteTools.ejecutar("consultar_mis_reservas", inputManipulado, turistaAutenticado);

        verify(reservaService).listarMisReservas(turistaAutenticado);
        verify(reservaService, org.mockito.Mockito.never()).listarMisReservas(otroTuristaSugeridoPorElModelo);
    }

    @Test
    void buscarSenderosDevuelveElCatalogoComoJson() {
        given(senderoService.listarActivos()).willReturn(List.of());

        String resultado = asistenteTools.ejecutar("buscar_senderos", Map.of(), UUID.randomUUID());

        assertThat(resultado).isEqualTo("[]");
    }

    @Test
    void consultarDisponibilidadParseaSenderoIdYFechaDelInput() {
        var disponibilidad = new com.nativatrips.backend.capacidad.dto.DisponibilidadResponse(
                1L, LocalDate.of(2026, 12, 1), 20, 5, 15, false);
        given(reservaService.obtenerDisponibilidad(1L, LocalDate.of(2026, 12, 1))).willReturn(disponibilidad);

        String resultado = asistenteTools.ejecutar(
                "consultar_disponibilidad", Map.of("senderoId", 1, "fecha", "2026-12-01"), UUID.randomUUID());

        assertThat(resultado).contains("\"cupoDisponible\":15");
    }

    @Test
    void devuelveUnJsonDeErrorEnVezDePropagarLaExcepcionCuandoElSenderoNoExiste() {
        given(reservaService.obtenerDisponibilidad(eq(999L), any()))
                .willThrow(new ResourceNotFoundException("Sendero no encontrado"));

        String resultado = asistenteTools.ejecutar(
                "consultar_disponibilidad", Map.of("senderoId", 999, "fecha", "2026-12-01"), UUID.randomUUID());

        assertThat(resultado).contains("Sendero no encontrado");
    }

    @Test
    void herramientaDesconocidaDevuelveUnErrorControlado() {
        String resultado = asistenteTools.ejecutar("herramienta_inventada", Map.of(), UUID.randomUUID());

        assertThat(resultado).contains("Herramienta desconocida");
    }
}
