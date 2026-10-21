package com.nativatrips.backend.reservas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
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

/** RF-36 de punta a punta: el correo con el que se reservo abre el historial de todas sus reservas. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class MisReservasTest {

    private static final String CABECERA = "X-Enlace-Historial";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    private String correo;
    private Long senderoId;

    @BeforeEach
    void setUp() {
        correo = "historial-" + UUID.randomUUID() + "@example.com";
        senderoId = senderoRepository.save(new Sendero(
                "Sendero historial " + UUID.randomUUID(), null, NivelDificultad.FACIL, 60, "ECOTURISMO", null,
                new BigDecimal("30000"))).getId();
        guardar(correo, LocalDate.now().minusDays(20));
        guardar(correo, LocalDate.now().plusDays(4));
        guardar("otra-" + UUID.randomUUID() + "@example.com", LocalDate.now().plusDays(4));
    }

    @Test
    void elEnlaceDelCorreoMuestraSoloLasReservasDeEseCorreoLaMasRecientePrimero() throws Exception {
        mockMvc.perform(post("/api/v1/mis-reservas/enlace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\": \"" + correo.toUpperCase() + "\"}"))
                .andExpect(status().isAccepted());

        String token = tokenDelCorreo();
        mockMvc.perform(get("/api/v1/mis-reservas").header(CABECERA, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].fecha").value(LocalDate.now().plusDays(4).toString()))
                .andExpect(jsonPath("$[1].fecha").value(LocalDate.now().minusDays(20).toString()))
                .andExpect(jsonPath("$[0].senderoNombre").exists())
                .andExpect(jsonPath("$[0].titular").doesNotExist());
    }

    @Test
    void unCorreoSinReservasRecibeLaMismaRespuestaYNingunCorreo() throws Exception {
        mockMvc.perform(post("/api/v1/mis-reservas/enlace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"correo\": \"nadie-" + UUID.randomUUID() + "@example.com\"}"))
                .andExpect(status().isAccepted());

        verify(notificacionService, never()).enviarCorreo(anyString(), anyString(), anyString());
    }

    @Test
    void unTokenInventadoNoAbreNada() throws Exception {
        mockMvc.perform(get("/api/v1/mis-reservas").header(CABECERA, "inventado"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("ENLACE_INVALIDO"));
        mockMvc.perform(get("/api/v1/mis-reservas")).andExpect(status().isNotFound());
    }

    private String tokenDelCorreo() {
        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq(correo), anyString(), cuerpo.capture());
        String url = cuerpo.getValue().lines().filter(l -> l.contains("/mis-reservas/")).findFirst().orElseThrow();
        assertThat(url).startsWith("http://localhost:3000/mis-reservas/");
        return url.substring(url.lastIndexOf('/') + 1);
    }

    private void guardar(String correoTitular, LocalDate fecha) {
        reservaRepository.save(Reserva.sinCuenta(
                senderoId, fecha, 2, TipoGrupo.ESTANDAR, null, null,
                "NT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(),
                new TitularReserva("Laura Gomez", TipoDocumento.CC, "1020304050", "CO", correoTitular, "57", "3001234567")));
    }
}
