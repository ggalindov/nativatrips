package com.nativatrips.backend.pagos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.pagos.repository.PagoRepository;
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

/** HU-03 y HU-18 de punta a punta: el titular paga el total de su reserva desde el enlace, sin cuenta. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "wompi.llave-publica=pub_test_llave",
    "wompi.secreto-integridad=test_integrity_secreto",
    "wompi.secreto-eventos=test_events_secreto"
})
class PagoConEnlaceTest {

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

    @MockitoBean
    private NotificacionService notificacionService;

    private Long senderoId;
    private final LocalDate fecha = LocalDate.now().plusDays(3);
    private final String correo = "titular-pago-" + UUID.randomUUID() + "@example.com";

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
    void elTitularPagaElTotalDesdeElEnlaceYUnSegundoIntentoReusaElMismoPago() throws Exception {
        String codigo = reservar(3);
        String token = tokenDelCorreo();

        String respuesta = mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.montoEnCentavos").value(13_500_000))
                .andExpect(jsonPath("$.moneda").value("COP"))
                .andExpect(jsonPath("$.llavePublica").value("pub_test_llave"))
                .andReturn().getResponse().getContentAsString();
        String referencia = JsonPath.read(respuesta, "$.referencia");
        assertThat(referencia).startsWith(codigo + "-");

        mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referencia").value(referencia));

        UUID reservaId = reservaRepository.findByCodigoReserva(codigo).orElseThrow().getId();
        assertThat(pagoRepository.findByReservaIdOrderByCreatedAtDesc(reservaId)).hasSize(1);
    }

    @Test
    void sinUnEnlaceValidoNoSeArmaNingunCobro() throws Exception {
        mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", "enlace-inventado-que-no-existe-en-la-base"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("ENLACE_INVALIDO"));
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
