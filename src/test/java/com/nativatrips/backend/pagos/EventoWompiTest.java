package com.nativatrips.backend.pagos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.pasarela.EventoWompiDePrueba;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.pagos.repository.EventoPagoRepository;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.repository.ReservaEstadoHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** HU-03 criterio 2 de punta a punta: solo un evento firmado por Wompi y por el monto del pago confirma la reserva. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "wompi.llave-publica=pub_test_llave",
    "wompi.secreto-integridad=test_integrity_secreto",
    "wompi.secreto-eventos=" + EventoWompiDePrueba.SECRETO
})
class EventoWompiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private CapacidadDiaRepository capacidadDiaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private EventoPagoRepository eventoRepository;

    @Autowired
    private ReservaEstadoHistorialRepository historialReservaRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    private Long senderoId;
    private final LocalDate fecha = LocalDate.now().plusDays(3);
    private final String correo = "titular-evento-" + UUID.randomUUID() + "@example.com";

    @BeforeEach
    void setUp() {
        senderoId = senderoRepository.save(new Sendero(
                "Sendero pago " + UUID.randomUUID(), null, NivelDificultad.FACIL, 90, "ECOTURISMO", null,
                new BigDecimal("45000"))).getId();
        UUID adminId = usuarioRepository.save(new Usuario(
                "admin-pago-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR)).getId();
        capacidadDiaRepository.save(new CapacidadDia(senderoId, fecha, 10, (short) 80, adminId));
    }

    @Test
    void unPagoAprobadoYFirmadoConfirmaLaReserva() throws Exception {
        String codigo = reservar(3);
        String referencia = iniciarPago();

        enviar(EventoWompiDePrueba.firmado("TX-APROBADA-" + UUID.randomUUID(), referencia, "APPROVED", 13_500_000))
                .andExpect(status().isOk());

        assertThat(reservaRepository.findByCodigoReserva(codigo).orElseThrow().getEstado()).isEqualTo(EstadoReserva.CONFIRMADA);
        assertThat(pagoRepository.findByReferencia(referencia).orElseThrow().getEstado()).isEqualTo(EstadoPago.APROBADO);
    }

    @Test
    void elMismoEventoRepetidoSoloSeAplicaUnaVez() throws Exception {
        String codigo = reservar(1);
        String referencia = iniciarPago();
        String evento = EventoWompiDePrueba.firmado("TX-REPETIDA-" + UUID.randomUUID(), referencia, "APPROVED", 4_500_000);

        enviar(evento).andExpect(status().isOk());
        enviar(evento).andExpect(status().isOk());

        UUID reservaId = reservaRepository.findByCodigoReserva(codigo).orElseThrow().getId();
        assertThat(historialReservaRepository.findByReservaIdOrderByCreatedAtAsc(reservaId))
                .filteredOn(h -> h.getEstadoNuevo() == EstadoReserva.CONFIRMADA)
                .hasSize(1);
        assertThat(eventoRepository.findByPagoId(pagoRepository.findByReferencia(referencia).orElseThrow().getId()))
                .hasSize(1);
        verify(notificacionService, org.mockito.Mockito.times(1))
                .enviarCorreo(eq(correo), org.mockito.ArgumentMatchers.startsWith("Comprobante de pago"), anyString());
    }

    @Test
    void conDosRechazosSePuedeReintentarYAlTerceroSeCancelaLaReserva() throws Exception {
        String codigo = reservar(1);
        String token = tokenDelCorreo();
        java.util.Set<String> referencias = new java.util.HashSet<>();

        for (int intento = 1; intento <= 3; intento++) {
            String referencia = iniciarPago(token);
            referencias.add(referencia);
            enviar(EventoWompiDePrueba.firmado("TX-RECHAZO-" + intento + "-" + UUID.randomUUID(), referencia, "DECLINED", 4_500_000))
                    .andExpect(status().isOk());
            EstadoReserva esperado = intento < 3 ? EstadoReserva.PENDIENTE_PAGO : EstadoReserva.CANCELADA;
            assertThat(reservaRepository.findByCodigoReserva(codigo).orElseThrow().getEstado())
                    .as("estado tras el rechazo %d", intento).isEqualTo(esperado);
        }

        assertThat(referencias).as("una referencia por intento").hasSize(3);
        mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", token)).andExpect(status().isConflict());
    }

    @Test
    void unEventoFalsificadoNoCambiaNada() throws Exception {
        String codigo = reservar(1);
        String referencia = iniciarPago();

        enviar(EventoWompiDePrueba.conChecksum("TX-FALSA", referencia, "APPROVED", 4_500_000, "a".repeat(64)))
                .andExpect(status().isUnauthorized());

        assertThat(reservaRepository.findByCodigoReserva(codigo).orElseThrow().getEstado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
        assertThat(pagoRepository.findByReferencia(referencia).orElseThrow().getEstado()).isEqualTo(EstadoPago.PENDIENTE);
    }

    @Test
    void unEventoFirmadoPorOtroMontoQueElDelPagoSeRechaza() throws Exception {
        String codigo = reservar(2);
        String referencia = iniciarPago();

        enviar(EventoWompiDePrueba.firmado("TX-MONTO", referencia, "APPROVED", 100)).andExpect(status().isBadRequest());

        assertThat(reservaRepository.findByCodigoReserva(codigo).orElseThrow().getEstado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
    }

    private String iniciarPago() throws Exception {
        return iniciarPago(tokenDelCorreo());
    }

    private String iniciarPago(String token) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.referencia");
    }

    private org.springframework.test.web.servlet.ResultActions enviar(String evento) throws Exception {
        return mockMvc.perform(post("/api/v1/pagos/wompi/eventos").contentType(MediaType.APPLICATION_JSON).content(evento));
    }

    private String reservar(int personas) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/reservas/sin-cuenta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"senderoId\": " + senderoId + ", \"fechaTour\": \"" + fecha + "\", \"personas\": " + personas
                                + ", \"titular\": {\"nombre\": \"Laura Gomez\", \"tipoDocumento\": \"CC\", \"documento\": \"1020304050\","
                                + " \"nacionalidad\": \"CO\", \"correo\": \"" + correo + "\", \"indicativo\": \"57\", \"celular\": \"3001234567\"}}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.codigoReserva");
    }

    private String tokenDelCorreo() {
        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq(correo), anyString(), cuerpo.capture());
        return cuerpo.getValue().replaceAll("(?s).*/mi-reserva/([A-Za-z0-9_-]{43}).*", "$1");
    }
}
