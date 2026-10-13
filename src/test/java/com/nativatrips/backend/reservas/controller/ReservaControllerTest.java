package com.nativatrips.backend.reservas.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.dto.ReservaResponse;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ReservaController.class)
@Import({SecurityConfig.class, ReservaControllerTest.TestSecurityBeans.class})
class ReservaControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    private static final String RESERVA_JSON = """
            {
                "senderoId": 1,
                "fechaTour": "2026-12-01",
                "tipoGrupo": "ESTANDAR",
                "integrantes": [{"nombreCompleto": "Juan Perez", "documentoIdentidad": "123"}]
            }
            """;

    @Test
    void crearSinAutenticarEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESERVA_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "PERSONAL_ADMINISTRATIVO")
    void crearComoPersonalAdministrativoEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESERVA_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TURISTA")
    void crearComoTuristaConIntegrantesVaciosEsRechazadoPorValidacion() throws Exception {
        String sinIntegrantes = """
                {"senderoId": 1, "fechaTour": "2026-12-01", "tipoGrupo": "ESTANDAR", "integrantes": []}
                """;

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sinIntegrantes))
                .andExpect(status().isBadRequest());
    }

    @Test
    void crearComoTuristaEsAceptado() throws Exception {
        given(reservaService.crearReserva(any(), any())).willReturn(new ReservaResponse(
                UUID.randomUUID(),
                null,
                1L,
                UUID.randomUUID(),
                null,
                LocalDate.of(2026, 12, 1),
                1,
                TipoGrupo.ESTANDAR,
                EstadoReserva.PENDIENTE_PAGO,
                java.time.Instant.now().plusSeconds(900),
                List.of(new IntegranteResponse("Juan Perez", "123"))));

        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(RESERVA_JSON)
                        .with(authentication(unTuristaAutenticado())))
                .andExpect(status().isCreated());
    }

    private static UsernamePasswordAuthenticationToken unTuristaAutenticado() {
        AuthenticatedUser principal = new AuthenticatedUser(UUID.randomUUID(), "turista@example.com", Rol.TURISTA);
        return new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_TURISTA")));
    }

    @Test
    void misReservasSinAutenticarEsRechazado() throws Exception {
        mockMvc.perform(get("/api/v1/reservas/mias")).andExpect(status().isForbidden());
    }
}
