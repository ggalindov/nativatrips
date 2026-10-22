package com.nativatrips.backend.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.EnlaceReservaService;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** RF-37 (Anexo 16) de punta a punta: solicitud con causal y soporte desde el enlace, y decision del administrador. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ReprogramacionTest {

    private static final byte[] PDF = "%PDF-1.4\n% certificado medico de prueba\n".getBytes(StandardCharsets.US_ASCII);

    @TempDir
    static Path archivos;

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry registro) {
        registro.add("app.archivos.directorio", archivos::toString);
    }

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
    private EnlaceReservaService enlaceService;

    @MockitoBean
    private NotificacionService notificacionService;

    private final LocalDate fechaOriginal = LocalDate.now().plusDays(3);
    private final LocalDate fechaNueva = LocalDate.now().plusDays(10);
    private Long senderoId;
    private UUID adminId;
    private Reserva reserva;
    private String token;

    @BeforeEach
    void setUp() {
        senderoId = senderoRepository.save(new Sendero(
                "Sendero reprogramacion " + UUID.randomUUID(), null, NivelDificultad.FACIL, 90, "ECOTURISMO", null,
                new BigDecimal("30000"))).getId();
        adminId = usuarioRepository.save(new Usuario(
                "admin-reprog-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR)).getId();
        capacidadDiaRepository.save(new CapacidadDia(senderoId, fechaOriginal, 10, (short) 80, adminId));
        capacidadDiaRepository.save(new CapacidadDia(senderoId, fechaNueva, 10, (short) 80, adminId));
        reserva = ReservasDePrueba.reserva(senderoId, fechaOriginal, 3, null);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        reserva = reservaRepository.save(reserva);
        String url = enlaceService.emitir(reserva).url();
        token = url.substring(url.lastIndexOf('/') + 1);
    }

    @Test
    void conSoporteLaReservaQuedaEnRevisionYAlAprobarsePasaALaNuevaFecha() throws Exception {
        String respuesta = solicitar(new MockMultipartFile("soporte", "incapacidad.pdf", "application/pdf", PDF))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.causal").value("INCAPACIDAD_MEDICA"))
                .andReturn().getResponse().getContentAsString();
        String solicitudId = JsonPath.read(respuesta, "$.id");

        assertThat(reservaRepository.findById(reserva.getId()).orElseThrow().getEstado()).isEqualTo(EstadoReserva.EN_REVISION);
        mockMvc.perform(get("/api/v1/mi-reserva").header("X-Enlace-Reserva", token))
                .andExpect(jsonPath("$.reprogramacion.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.reprogramacion.fechaDeseada").value(fechaNueva.toString()));

        mockMvc.perform(get("/api/v1/reprogramaciones").with(authentication(administrador())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '" + solicitudId + "')].codigoReserva").value(reserva.getCodigoReserva()));
        mockMvc.perform(get("/api/v1/reprogramaciones/" + solicitudId + "/soporte").with(authentication(administrador())))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(PDF));

        mockMvc.perform(post("/api/v1/reprogramaciones/" + solicitudId + "/decision")
                        .with(authentication(administrador()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"aprobar\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADA"));

        Reserva reprogramada = reservaRepository.findById(reserva.getId()).orElseThrow();
        assertThat(reprogramada.getEstado()).isEqualTo(EstadoReserva.CONFIRMADA);
        assertThat(reprogramada.getFechaTour()).isEqualTo(fechaNueva);
        assertThat(reservaRepository.sumarPersonasActivas(senderoId, fechaOriginal, EstadoReserva.queOcupanCupo())).isZero();
        assertThat(reservaRepository.sumarPersonasActivas(senderoId, fechaNueva, EstadoReserva.queOcupanCupo())).isEqualTo(3);
    }

    @Test
    void alRechazarseLaReservaQuedaCanceladaSinDevolucion() throws Exception {
        String respuesta = solicitar(new MockMultipartFile("soporte", "acta.png", "image/png",
                        new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0}))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String solicitudId = JsonPath.read(respuesta, "$.id");

        mockMvc.perform(post("/api/v1/reprogramaciones/" + solicitudId + "/decision")
                        .with(authentication(administrador()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"aprobar\": false, \"motivo\": \"El soporte no corresponde a la causal\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RECHAZADA"));

        assertThat(reservaRepository.findById(reserva.getId()).orElseThrow().getEstado()).isEqualTo(EstadoReserva.CANCELADA);
    }

    @Test
    void unArchivoDisfrazadoDePdfSeRechazaYLaReservaSigueConfirmada() throws Exception {
        solicitar(new MockMultipartFile("soporte", "certificado.pdf", "application/pdf", "MZ ejecutable".getBytes()))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.codigo").value("TIPO_NO_PERMITIDO"));

        assertThat(reservaRepository.findById(reserva.getId()).orElseThrow().getEstado()).isEqualTo(EstadoReserva.CONFIRMADA);
    }

    @Test
    void unaReservaSinPagarNoSeReprograma() throws Exception {
        reserva.setEstado(EstadoReserva.PENDIENTE_PAGO);
        reservaRepository.save(reserva);

        solicitar(new MockMultipartFile("soporte", "incapacidad.pdf", "application/pdf", PDF))
                .andExpect(status().isConflict());
    }

    @Test
    void elGuiaNoVeLaBandejaDeReprogramaciones() throws Exception {
        AuthenticatedUser guia = new AuthenticatedUser(UUID.randomUUID(), "guia@ecopalacio.co", Rol.GUIA_TURISTICO);
        mockMvc.perform(get("/api/v1/reprogramaciones").with(authentication(new UsernamePasswordAuthenticationToken(
                        guia, null, List.of(new SimpleGrantedAuthority("ROLE_GUIA_TURISTICO"))))))
                .andExpect(status().isForbidden());
    }

    private ResultActions solicitar(MockMultipartFile soporte) throws Exception {
        return mockMvc.perform(multipart("/api/v1/mi-reserva/reprogramacion")
                .file(soporte)
                .header("X-Enlace-Reserva", token)
                .param("causal", "INCAPACIDAD_MEDICA")
                .param("descripcion", "Incapacidad de tres dias por gripa")
                .param("fechaDeseada", fechaNueva.toString()));
    }

    private UsernamePasswordAuthenticationToken administrador() {
        AuthenticatedUser principal = new AuthenticatedUser(adminId, "admin@ecopalacio.co", Rol.ADMINISTRADOR);
        return new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR")));
    }
}
