package com.nativatrips.backend.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.repository.AccesoEnlaceReservaRepository;
import com.nativatrips.backend.reservas.repository.EnlaceReservaRepository;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-18 (NAT-112) de punta a punta: el enlace del correo abre la reserva, sin cuenta ni sesion. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class MiReservaTest {

    private static final String CABECERA = "X-Enlace-Reserva";

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
    private EnlaceReservaRepository enlaceRepository;

    @Autowired
    private AccesoEnlaceReservaRepository accesoRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    private Long senderoId;
    private final LocalDate fecha = LocalDate.now().plusDays(3);
    private String correo;

    @BeforeEach
    void setUp() {
        senderoId = senderoRepository.save(new Sendero(
                "Sendero mi reserva " + UUID.randomUUID(), null, NivelDificultad.FACIL, 90, "ECOTURISMO", null,
                new BigDecimal("30000"))).getId();
        UUID adminId = usuarioRepository.save(new Usuario(
                "admin-mi-reserva-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR)).getId();
        capacidadDiaRepository.save(new CapacidadDia(senderoId, fecha, 10, (short) 80, adminId));
        correo = "titular-" + UUID.randomUUID() + "@example.com";
    }

    @Test
    void elEnlaceDelCorreoMuestraLaReservaYCadaConsultaQuedaRegistrada() throws Exception {
        String codigo = reservar(3);
        String token = tokenDelUltimoCorreo();

        consultar(token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(codigo))
                .andExpect(jsonPath("$.senderoId").value(senderoId))
                .andExpect(jsonPath("$.personas").value(3))
                .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
                .andExpect(jsonPath("$.horaSalida").value("07:00:00"))
                .andExpect(jsonPath("$.titular.correo").value(correo))
                .andExpect(jsonPath("$.acompanantes.length()").value(0));
        consultar(token).andExpect(status().isOk());

        UUID enlaceId = enlaceRepository.findAll().stream()
                .filter(e -> e.getReservaId().equals(reservaRepository.findByCodigoReserva(codigo).orElseThrow().getId()))
                .findFirst().orElseThrow().getId();
        assertThat(accesoRepository.findByEnlaceIdOrderByCreatedAtAsc(enlaceId)).hasSize(2);
    }

    @Test
    void sinEnlaceOConUnoInventadoNoSeMuestraNada() throws Exception {
        reservar(1);

        mockMvc.perform(get("/api/v1/mi-reserva"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("ENLACE_INVALIDO"));
        consultar("token-inventado-que-no-existe-en-la-base-de-datos")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.titular").doesNotExist());
    }

    @Test
    void pedirOtroEnlaceConCodigoYCorreoAnulaElAnterior() throws Exception {
        String codigo = reservar(1);
        String primero = tokenDelUltimoCorreo();
        clearInvocations(notificacionService);

        pedirEnlace(codigo.toLowerCase(), correo.toUpperCase()).andExpect(status().isAccepted());
        String segundo = tokenDelUltimoCorreo();

        consultar(primero).andExpect(status().isNotFound());
        consultar(segundo).andExpect(status().isOk()).andExpect(jsonPath("$.codigo").value(codigo));
    }

    @Test
    void conUnCorreoQueNoEsElDelTitularLaRespuestaEsLaMismaPeroNoLlegaNada() throws Exception {
        String codigo = reservar(1);
        clearInvocations(notificacionService);

        pedirEnlace(codigo, "otra-persona@example.com").andExpect(status().isAccepted());
        pedirEnlace("NT-ZZZZZZ", correo).andExpect(status().isAccepted());

        verify(notificacionService, never()).enviarCorreo(anyString(), anyString(), anyString());
    }

    @Test
    void losAcompanantesQueFaltanSeRegistranHastaCompletarLaReserva() throws Exception {
        reservar(2);
        String token = tokenDelUltimoCorreo();

        agregar(token, "{\"nombre\": \"Pierre Martin\", \"tipoDocumento\": \"PASAPORTE\", \"documento\": \"19AB12345\", \"nacionalidad\": \"FR\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acompanantes[0].nombre").value("Pierre Martin"))
                .andExpect(jsonPath("$.acompanantes[0].nacionalidad").value("FR"));

        agregar(token, "{\"nombre\": \"Otra Persona\", \"tipoDocumento\": \"CC\", \"documento\": \"1098765432\", \"nacionalidad\": \"CO\"}")
                .andExpect(status().isConflict());
        agregar("enlace-falso-de-otra-reserva-que-no-existe-en-la-base",
                "{\"nombre\": \"Otra Persona\", \"tipoDocumento\": \"CC\", \"documento\": \"1098765432\", \"nacionalidad\": \"CO\"}")
                .andExpect(status().isNotFound());
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

    private String tokenDelUltimoCorreo() {
        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService, org.mockito.Mockito.atLeastOnce()).enviarCorreo(eq(correo), anyString(), cuerpo.capture());
        String ultimo = cuerpo.getAllValues().get(cuerpo.getAllValues().size() - 1);
        return ultimo.replaceAll("(?s).*/mi-reserva/([A-Za-z0-9_-]{43}).*", "$1");
    }

    private ResultActions consultar(String token) throws Exception {
        return mockMvc.perform(get("/api/v1/mi-reserva").header(CABECERA, token));
    }

    private ResultActions pedirEnlace(String codigo, String correoTitular) throws Exception {
        return mockMvc.perform(post("/api/v1/mi-reserva/enlace")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"codigo\": \"" + codigo + "\", \"correo\": \"" + correoTitular + "\"}"));
    }

    private ResultActions agregar(String token, String acompanante) throws Exception {
        return mockMvc.perform(post("/api/v1/mi-reserva/acompanantes")
                .header(CABECERA, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(acompanante));
    }
}
