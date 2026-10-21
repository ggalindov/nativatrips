package com.nativatrips.backend.reservas.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
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
        RevocacionTokens revocacionTokens() {
            return Mockito.mock(RevocacionTokens.class);
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, RevocacionTokens revocacionTokens) {
            return new JwtAuthenticationFilter(jwtTokenProvider, revocacionTokens);
        }
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void laReservaConCuentaYLaCancelacionDelTuristaYaNoExisten() throws Exception {
        String reserva = """
                {"senderoId": 1, "fechaTour": "2026-12-01", "tipoGrupo": "ESTANDAR",
                 "integrantes": [{"nombreCompleto": "Juan Perez", "documentoIdentidad": "123"}]}
                """;
        mockMvc.perform(post("/api/v1/reservas").contentType(MediaType.APPLICATION_JSON).content(reserva))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/reservas/mias")).andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/reservas/" + UUID.randomUUID() + "/cancelar")).andExpect(status().isNotFound());
    }

    @Test
    void laBandejaDeRevisionSinSesionEsRechazada() throws Exception {
        mockMvc.perform(get("/api/v1/reservas/en-revision")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "GUIA_TURISTICO")
    void elGuiaNoVeLaBandejaDeRevision() throws Exception {
        mockMvc.perform(get("/api/v1/reservas/en-revision")).andExpect(status().isForbidden());
    }

    @Test
    void elGuiaMarcaLaAsistenciaDeUnaPersona() throws Exception {
        UUID guiaId = UUID.randomUUID();
        UUID reservaId = UUID.randomUUID();
        UUID integranteId = UUID.randomUUID();
        given(reservaService.marcarAsistenciaIntegrante(eq(reservaId), eq(integranteId), eq(true), eq(guiaId)))
                .willReturn(new IntegranteResponse(integranteId, "Laura", TipoDocumento.CC, "1020304050", "CO", true, 2));

        mockMvc.perform(put("/api/v1/reservas/" + reservaId + "/integrantes/" + integranteId + "/asistencia")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"asistio\": true}")
                        .with(authentication(guia(guiaId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asistio").value(true))
                .andExpect(jsonPath("$.visitasPrevias").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void elAdministradorNoMarcaAsistencia() throws Exception {
        mockMvc.perform(put("/api/v1/reservas/" + UUID.randomUUID() + "/integrantes/" + UUID.randomUUID() + "/asistencia")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"asistio\": true}"))
                .andExpect(status().isForbidden());
        Mockito.verify(reservaService, Mockito.never()).marcarAsistenciaIntegrante(any(), any(), Mockito.anyBoolean(), any());
    }

    private static UsernamePasswordAuthenticationToken guia(UUID id) {
        AuthenticatedUser principal = new AuthenticatedUser(id, "guia@ecopalacio.co", Rol.GUIA_TURISTICO);
        return new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_GUIA_TURISTICO")));
    }
}
