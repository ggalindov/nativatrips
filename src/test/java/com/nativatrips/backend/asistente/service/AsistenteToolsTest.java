package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.reservas.service.MiReservaService;
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

    @Mock
    private MiReservaService miReservaService;

    private AsistenteTools asistenteTools;

    @BeforeEach
    void setUp() {
        Clock reloj = Clock.fixed(Instant.parse("2026-11-18T15:00:00Z"), ZoneId.of("America/Bogota"));
        asistenteTools = new AsistenteTools(senderoService, reservaService, miReservaService, JsonMapper.builder().build(), reloj);
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

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3, "fecha", "2026-11-28"), AsistenteTools.Contexto.VACIO);

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

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3), AsistenteTools.Contexto.VACIO);

        assertThat(resultado.reserva().fecha()).isNull();
    }

    @Test
    void prepararReservaConUnaFechaPasadaNoOfreceElBoton() {
        given(senderoService.obtener(3L)).willReturn(sendero(3L, "Lagunas de Siecha"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 3, "fecha", "2026-11-01"), AsistenteTools.Contexto.VACIO);

        assertThat(resultado.reserva()).isNull();
        assertThat(resultado.contenido()).contains("ya paso");
    }

    @Test
    void prepararReservaDeUnSenderoQueNoSeOfreceDevuelveError() {
        given(senderoService.obtener(9L)).willThrow(new ResourceNotFoundException("Sendero no encontrado"));

        var resultado = asistenteTools.ejecutarConEfectos("preparar_reserva", Map.of("senderoId", 9), AsistenteTools.Contexto.VACIO);

        assertThat(resultado.reserva()).isNull();
        assertThat(resultado.contenido()).contains("Sendero no encontrado");
    }

    @Test
    void derivarAPersonaDejaElMotivo() {
        var pide = asistenteTools.ejecutarConEfectos("derivar_a_persona", Map.of("motivo", "PIDE_PERSONA"), AsistenteTools.Contexto.VACIO);
        var otro = asistenteTools.ejecutarConEfectos("derivar_a_persona", Map.of("motivo", "cualquier cosa"), AsistenteTools.Contexto.VACIO);

        assertThat(pide.motivoDerivacion()).isEqualTo(Derivacion.PIDE_PERSONA);
        assertThat(otro.motivoDerivacion()).isEqualTo(Derivacion.NO_RESUELTO);
        assertThat(pide.reserva()).isNull();
    }
    @Test
    void consultarMiReservaSoloExisteConElEnlaceAbierto() {
        assertThat(asistenteTools.definiciones())
                .extracting(definicion -> definicion.get("name"))
                .doesNotContain("consultar_mi_reserva");
        assertThat(asistenteTools.definiciones(new AsistenteTools.Contexto("token", "203.0.113.7")))
                .extracting(definicion -> definicion.get("name"))
                .contains("consultar_mi_reserva");
    }

    @Test
    void sinEnlaceElModeloNoPuedeLeerReservasAunqueLoIntente() {
        var resultado = asistenteTools.ejecutarConEfectos("consultar_mi_reserva", Map.of(), AsistenteTools.Contexto.VACIO);

        assertThat(resultado.contenido()).contains("Sin el enlace de la reserva");
        org.mockito.Mockito.verifyNoInteractions(miReservaService);
    }

    @Test
    void conElEnlaceDevuelveUnResumenSinDocumentosNiDatosDeContacto() {
        var titular = new com.nativatrips.backend.reservas.dto.TitularResponse(
                "Laura Gomez", com.nativatrips.backend.reservas.model.TipoDocumento.CC, "1020304050", "CO",
                "laura@example.com", "57", "3001234567");
        var acompanante = new com.nativatrips.backend.reservas.dto.PersonaResponse(
                "Pedro Gomez", com.nativatrips.backend.reservas.model.TipoDocumento.CC, "99887766", "CO");
        var reserva = new com.nativatrips.backend.reservas.dto.MiReservaResponse(
                "NT-7Q4KX2", 3L, "Lagunas de Siecha", LocalDate.of(2026, 11, 28), java.time.LocalTime.of(7, 0), 2,
                titular, List.of(acompanante), com.nativatrips.backend.reservas.model.EstadoReserva.CONFIRMADA, null,
                "Marta Leon", "Portada del parque", com.nativatrips.backend.reservas.model.TipoGrupo.ESTANDAR, null, null);
        given(miReservaService.consultar("token", "203.0.113.7")).willReturn(reserva);

        var resultado = asistenteTools.ejecutarConEfectos(
                "consultar_mi_reserva", Map.of(), new AsistenteTools.Contexto("token", "203.0.113.7"));

        assertThat(resultado.contenido())
                .contains("NT-7Q4KX2", "Lagunas de Siecha", "2026-11-28", "07:00", "CONFIRMADA", "Marta Leon")
                .contains("\"acompanantesRegistrados\":1")
                .doesNotContain("1020304050", "99887766", "laura@example.com", "3001234567", "Pedro");
    }

    @Test
    void unEnlaceVencidoSeExplicaSinRomperLaConversacion() {
        given(miReservaService.consultar(eq("vencido"), any()))
                .willThrow(new com.nativatrips.backend.common.exception.BusinessRuleException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "El enlace no es valido o ya caduco"));

        var resultado = asistenteTools.ejecutarConEfectos(
                "consultar_mi_reserva", Map.of(), new AsistenteTools.Contexto("vencido", "203.0.113.7"));

        assertThat(resultado.contenido()).contains("El enlace no es valido o ya caduco");
    }
}
