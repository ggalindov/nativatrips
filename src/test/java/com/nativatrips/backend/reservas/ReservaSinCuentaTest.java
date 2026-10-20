package com.nativatrips.backend.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.AdditionalMatchers.and;
import static org.mockito.ArgumentMatchers.contains;
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
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-02 (NAT-83) de punta a punta: un visitante sin sesion aparta cupo y recibe su codigo por correo. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ReservaSinCuentaTest {

    private static final int CUPO_DEL_DIA = 6;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private ReservaIntegranteRepository integranteRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private CapacidadDiaRepository capacidadDiaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    private Long senderoId;
    private final LocalDate fecha = LocalDate.now().plusDays(3);

    @BeforeEach
    void setUp() {
        senderoId = senderoRepository.save(new Sendero(
                "Sendero sin cuenta " + UUID.randomUUID(), null, NivelDificultad.MODERADO, 120, "ECOTURISMO", null,
                new BigDecimal("45000"))).getId();
        UUID adminId = usuarioRepository.save(new Usuario(
                "admin-sin-cuenta-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR)).getId();
        capacidadDiaRepository.save(new CapacidadDia(senderoId, fecha, CUPO_DEL_DIA, (short) 80, adminId));
    }

    @Test
    void unVisitanteSinSesionApartaElCupoQuinceMinutosYRecibeElCodigo() throws Exception {
        Instant antes = Instant.now();

        String respuesta = reservar(4, titular("CO", "CC", "1020304050", "57", "3001234567"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigoReserva").value(org.hamcrest.Matchers.matchesPattern("NT-[2-9A-HJKMNP-Z]{6}")))
                .andExpect(jsonPath("$.estado").value("PENDIENTE_PAGO"))
                .andExpect(jsonPath("$.cantidadPersonas").value(4))
                .andExpect(jsonPath("$.titular").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        String codigo = JsonPath.read(respuesta, "$.codigoReserva");
        Reserva guardada = reservaRepository.findAll().stream()
                .filter(r -> codigo.equals(r.getCodigoReserva()))
                .findFirst().orElseThrow();
        assertThat(guardada.getTuristaId()).isNull();
        assertThat(guardada.getTitular().getCorreo()).isEqualTo("laura@example.com");
        assertThat(guardada.getTitular().getTipoDocumento()).isEqualTo(TipoDocumento.CC);
        assertThat(guardada.getBloqueoExpiraEn()).isBetween(
                antes.plus(Duration.ofMinutes(15)), Instant.now().plus(Duration.ofMinutes(15)));
        assertThat(integranteRepository.findByReservaId(guardada.getId())).hasSize(1);
        assertThat(reservaRepository.sumarPersonasActivas(senderoId, fecha, EstadoReserva.queOcupanCupo())).isEqualTo(4);
        verify(notificacionService).enviarCorreo(
                eq("laura@example.com"), contains(codigo), and(contains(codigo), contains("http://localhost:3000/mi-reserva/")));
    }

    @Test
    void siNoAlcanzaElCupoDelDiaSeRechazaSinGuardarNada() throws Exception {
        reservar(4, titular("CO", "CC", "1020304050", "57", "3001234567")).andExpect(status().isCreated());

        reservar(3, titular("CO", "CC", "1020304051", "57", "3001234568"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("CUPO_INSUFICIENTE"))
                .andExpect(jsonPath("$.detalles.cupoDisponible").value(2))
                .andExpect(jsonPath("$.message").value("Solo quedan 2 cupos para el " + fecha + " y la reserva es de 3 personas"));

        assertThat(reservaRepository.sumarPersonasActivas(senderoId, fecha, EstadoReserva.queOcupanCupo())).isEqualTo(4);
    }

    @Test
    void unExtranjeroConPasaporteEIndicativoInternacionalPuedeReservar() throws Exception {
        reservar(1, titular("FR", "PASAPORTE", "19AB12345", "33", "612345678")).andExpect(status().isCreated());
    }

    @Test
    void elDocumentoDebeCorresponderALaNacionalidad() throws Exception {
        reservar(1, titular("CO", "PASAPORTE", "AB123456", "57", "3001234567")).andExpect(status().isBadRequest());
        reservar(1, titular("FR", "CC", "1020304050", "33", "612345678")).andExpect(status().isBadRequest());
    }

    @Test
    void laCedulaSoloTieneDigitosYElCelularColombianoEmpiezaPorTres() throws Exception {
        reservar(1, titular("CO", "CC", "10AB3040", "57", "3001234567")).andExpect(status().isBadRequest());
        reservar(1, titular("CO", "CC", "1020304050", "57", "6011234567")).andExpect(status().isBadRequest());
    }

    @Test
    void faltanDatosDelTitularOLaCantidadNoEsValida() throws Exception {
        reservar(0, titular("CO", "CC", "1020304050", "57", "3001234567")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/reservas/sin-cuenta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"senderoId\": " + senderoId + ", \"fechaTour\": \"" + fecha + "\", \"personas\": 1}"))
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.findAll().stream().filter(r -> senderoId.equals(r.getSenderoId())).toList())
                .isEqualTo(List.of());
    }

    @Test
    void losAcompanantesQueYaSeConocenQuedanComoIntegrantesConSuNacionalidad() throws Exception {
        String acompanantes = """
                [{"nombre": "Pierre Martin", "tipoDocumento": "PASAPORTE", "documento": "19AB12345", "nacionalidad": "FR"},
                 {"nombre": "Sofia Gomez", "tipoDocumento": "TI", "documento": "1098765432", "nacionalidad": "CO"}]""";

        String respuesta = reservar(3, titular("CO", "CC", "1020304050", "57", "3001234567"), acompanantes)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String codigo = JsonPath.read(respuesta, "$.codigoReserva");
        Reserva guardada = reservaRepository.findAll().stream()
                .filter(r -> codigo.equals(r.getCodigoReserva()))
                .findFirst().orElseThrow();
        assertThat(integranteRepository.findByReservaId(guardada.getId()))
                .extracting(i -> i.getNombreCompleto() + "/" + i.getTipoDocumento() + "/" + i.getNacionalidad())
                .containsExactlyInAnyOrder("Laura Gomez/CC/CO", "Pierre Martin/PASAPORTE/FR", "Sofia Gomez/TI/CO");
    }

    @Test
    void noPuedeHaberMasAcompanantesQuePersonasNiDocumentosQueNoCorrespondan() throws Exception {
        String dos = """
                [{"nombre": "Pierre Martin", "tipoDocumento": "PASAPORTE", "documento": "19AB12345", "nacionalidad": "FR"},
                 {"nombre": "Sofia Gomez", "tipoDocumento": "TI", "documento": "1098765432", "nacionalidad": "CO"}]""";
        reservar(2, titular("CO", "CC", "1020304050", "57", "3001234567"), dos).andExpect(status().isBadRequest());

        String extranjeroConCedula = """
                [{"nombre": "Pierre Martin", "tipoDocumento": "CC", "documento": "1020304050", "nacionalidad": "FR"}]""";
        reservar(2, titular("CO", "CC", "1020304050", "57", "3001234567"), extranjeroConCedula)
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.sumarPersonasActivas(senderoId, fecha, EstadoReserva.queOcupanCupo())).isZero();
    }

    private static String titular(String nacionalidad, String tipoDocumento, String documento, String indicativo, String celular) {
        return """
                {"nombre": "Laura Gomez", "tipoDocumento": "%s", "documento": "%s", "nacionalidad": "%s",
                 "correo": "Laura@Example.com", "indicativo": "%s", "celular": "%s"}"""
                .formatted(tipoDocumento, documento, nacionalidad, indicativo, celular);
    }

    private ResultActions reservar(int personas, String titular) throws Exception {
        return reservar(personas, titular, "[]");
    }

    private ResultActions reservar(int personas, String titular, String acompanantes) throws Exception {
        return mockMvc.perform(post("/api/v1/reservas/sin-cuenta")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senderoId\": " + senderoId + ", \"fechaTour\": \"" + fecha + "\", \"personas\": " + personas
                        + ", \"titular\": " + titular + ", \"acompanantes\": " + acompanantes + "}"));
    }
}
