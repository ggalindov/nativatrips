package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.service.SenderoService;
import com.nativatrips.backend.asistente.dto.Derivacion;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
        Clock reloj = Clock.fixed(Instant.parse("2026-11-18T15:00:00Z"), ZoneId.of("America/Bogota"));
        asistenteTools = new AsistenteTools(senderoService, reservaService, JsonMapper.builder().build(), reloj);
    }

    @Test
    void ningunaHerramientaDevuelveReservas() {
        assertThat(asistenteTools.definiciones())
                .extracting(definicion -> definicion.get("name"))
                .containsExactly("buscar_senderos", "consultar_disponibilidad", "preparar_reserva", "derivar_a_persona");
    }

    @Test
    void siElModeloPideReservasSeRechazaSinConsultarNada() {
        String resultado = asistenteTools.ejecutar("consultar_mis_reservas", Map.of("turistaId", UUID.randomUUID().toString()));

        assertThat(resultado).contains("Herramienta desconocida");
        org.mockito.Mockito.verifyNoInteractions(reservaService);
    }

    @Test
    void buscarSenderosDevuelveElCatalogoComoJson() {
        given(senderoService.listarActivos()).willReturn(List.of());

        String resultado = asistenteTools.ejecutar("buscar_senderos", Map.of());

        assertThat(resultado).isEqualTo("[]");
    }

    @Test
    void consultarDisponibilidadParseaSenderoIdYFechaDelInput() {
        var disponibilidad = new com.nativatrips.backend.capacidad.dto.DisponibilidadResponse(
                1L, LocalDate.of(2026, 12, 1), 20, 5, 15, false);
        given(reservaService.obtenerDisponibilidad(1L, LocalDate.of(2026, 12, 1))).willReturn(disponibilidad);

        String resultado = asistenteTools.ejecutar(
                "consultar_disponibilidad", Map.of("senderoId", 1, "fecha", "2026-12-01"));

        assertThat(resultado).contains("\"cupoDisponible\":15");
    }

    @Test
    void devuelveUnJsonDeErrorEnVezDePropagarLaExcepcionCuandoElSenderoNoExiste() {
        given(reservaService.obtenerDisponibilidad(eq(999L), any()))
                .willThrow(new ResourceNotFoundException("Sendero no encontrado"));

        String resultado = asistenteTools.ejecutar(
                "consultar_disponibilidad", Map.of("senderoId", 999, "fecha", "2026-12-01"));

        assertThat(resultado).contains("Sendero no encontrado");
    }

    @Test
    void herramientaDesconocidaDevuelveUnErrorControlado() {
        String resultado = asistenteTools.ejecutar("herramienta_inventada", Map.of());

        assertThat(resultado).contains("Herramienta desconocida");
    }
    private SenderoResponse sendero(long id, String nombre) {
        return new SenderoResponse(id, nombre, null, null, 240, null, null, null, true, true,
                null, null, null, null, null, null, List.of(), List.of());
    }

    @Test
    void prepararReservaDejaElSenderoYLaFechaParaElBoton() {
        given(senderoService.obtener(3L)).willReturn(sendero(3L, "Lagunas de Siecha"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3, "fecha", "2026-11-28"));

        assertThat(resultado.reserva()).isNotNull();
        assertThat(resultado.reserva().senderoId()).isEqualTo(3L);
        assertThat(resultado.reserva().senderoNombre()).isEqualTo("Lagunas de Siecha");
        assertThat(resultado.reserva().fecha()).isEqualTo("2026-11-28");
        assertThat(resultado.motivoDerivacion()).isNull();
        org.mockito.Mockito.verifyNoInteractions(reservaService);
    }

    @Test
    void prepararReservaSinFechaDejaSoloElSendero() {
        given(senderoService.obtener(3L)).willReturn(sendero(3L, "Lagunas de Siecha"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3));

        assertThat(resultado.reserva().fecha()).isNull();
    }

    @Test
    void prepararReservaConUnaFechaPasadaNoOfreceElBoton() {
        given(senderoService.obtener(3L)).willReturn(sendero(3L, "Lagunas de Siecha"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3, "fecha", "2026-11-01"));

        assertThat(resultado.reserva()).isNull();
        assertThat(resultado.contenido()).contains("ya paso");
    }

    @Test
    void prepararReservaDeUnSenderoQueNoSeOfreceDevuelveError() {
        given(senderoService.obtener(9L)).willThrow(new ResourceNotFoundException("Sendero no encontrado"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 9));

        assertThat(resultado.reserva()).isNull();
        assertThat(resultado.contenido()).contains("Sendero no encontrado");
    }

    @Test
    void derivarAPersonaDejaElMotivo() {
        var pide = asistenteTools.ejecutarConEfectos("derivar_a_persona", Map.of("motivo", "PIDE_PERSONA"));
        var otro = asistenteTools.ejecutarConEfectos("derivar_a_persona", Map.of("motivo", "cualquier cosa"));

        assertThat(pide.motivoDerivacion()).isEqualTo(Derivacion.PIDE_PERSONA);
        assertThat(otro.motivoDerivacion()).isEqualTo(Derivacion.NO_RESUELTO);
        assertThat(pide.reserva()).isNull();
    }
}
