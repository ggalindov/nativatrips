package com.nativatrips.backend.senderos.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.service.SenderoService;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * JwtTokenProvider/JwtAuthenticationFilter se registran como beans reales (no mocks): un
 * OncePerRequestFilter mockeado no invoca filterChain.doFilter(), lo que corta la cadena de
 * Spring Security antes de llegar al controller y deja pasar cualquier request como si no
 * hubiera seguridad.
 */
@WebMvcTest(SenderoController.class)
@Import({SecurityConfig.class, SenderoControllerTest.TestSecurityBeans.class})
class SenderoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SenderoService senderoService;

    @MockitoBean
    private ReservaService reservaService;

    @TestConfiguration
    static class TestSecurityBeans {
        @Bean
        JwtProperties jwtProperties() {
            JwtProperties properties = new JwtProperties();
            properties.setSecret("test-only-secret-not-for-production-min-32-bytes-long");
            properties.setExpirationMinutes(60);
            return properties;
        }

        @Bean
        JwtTokenProvider jwtTokenProvider(JwtProperties jwtProperties) {
            return new JwtTokenProvider(jwtProperties);
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
            return new JwtAuthenticationFilter(jwtTokenProvider);
        }
    }

    private static final String SENDERO_JSON = """
            {
                "nombre": "Sendero Piedras Gordas",
                "descripcion": "Recorrido por el paramo",
                "nivelDificultad": "MODERADO",
                "duracionMinutos": 180,
                "tipoExperiencia": "ECOTURISMO",
                "requisitosIngreso": "Botas de trekking",
                "precio": 50000
            }
            """;

    @Test
    void listarEsPublico() throws Exception {
        given(senderoService.listarActivos()).willReturn(List.of(unSendero()));

        mockMvc.perform(get("/api/v1/senderos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void crearSinAutenticarEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/senderos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SENDERO_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TURISTA")
    void crearComoTuristaEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/senderos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SENDERO_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void obtenerDevuelveLaFichaTecnicaYLosDestacados() throws Exception {
        given(senderoService.obtener(1L)).willReturn(unSendero());

        mockMvc.perform(get("/api/v1/senderos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distanciaKm").value(8.5))
                .andExpect(jsonPath("$.horaSalida").value("07:00:00"))
                .andExpect(jsonPath("$.destacados", hasSize(2)));
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void crearConMasDeOchoDestacadosEsRechazadoPorValidacion() throws Exception {
        String conNueveDestacados = SENDERO_JSON.replace(
                "\"precio\": 50000",
                "\"precio\": 50000, \"destacados\": [\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\"]");

        mockMvc.perform(post("/api/v1/senderos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(conNueveDestacados))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "GUIA_TURISTICO")
    void crearComoGuiaEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/senderos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SENDERO_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void crearComoAdministradorEsAceptado() throws Exception {
        given(senderoService.crear(any())).willReturn(unSendero());

        mockMvc.perform(post("/api/v1/senderos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SENDERO_JSON))
                .andExpect(status().isCreated());
    }

    private static SenderoResponse unSendero() {
        return new SenderoResponse(
                1L,
                "Sendero Piedras Gordas",
                "Recorrido por el paramo",
                NivelDificultad.MODERADO,
                180,
                "ECOTURISMO",
                "Botas de trekking",
                new BigDecimal("50000"),
                true,
                new BigDecimal("8.5"),
                650,
                3550,
                "Laguna de Siecha",
                LocalTime.of(7, 0),
                "Portería principal",
                List.of("Lagunas glaciares", "Frailejonales"));
    }
}
