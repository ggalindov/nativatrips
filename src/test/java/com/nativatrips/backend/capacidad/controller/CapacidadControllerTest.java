package com.nativatrips.backend.capacidad.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import java.time.LocalDate;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CapacidadController.class)
@Import({SecurityConfig.class, CapacidadControllerTest.TestSecurityBeans.class})
class CapacidadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CapacidadService capacidadService;

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

    private static final String CARGA_JSON = """
            {"dias": [{"fecha": "2026-10-26", "cupoMaximo": 30}, {"fecha": "2026-10-27", "cupoMaximo": 25, "umbralAlertaPct": 90}]}
            """;

    @Test
    void cargarComoAdministradorDevuelveLosDiasGuardados() throws Exception {
        UUID adminId = UUID.randomUUID();
        given(capacidadService.cargarDias(eq(3L), any(), eq(adminId))).willReturn(List.of(
                unDia(LocalDate.of(2026, 10, 26), 30), unDia(LocalDate.of(2026, 10, 27), 25)));

        mockMvc.perform(put("/api/v1/senderos/3/capacidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CARGA_JSON)
                        .with(authentication(autenticado(adminId, Rol.ADMINISTRADOR))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[1].cupoMaximo").value(25));
    }

    @Test
    void cargarComoGuiaEsRechazado() throws Exception {
        mockMvc.perform(put("/api/v1/senderos/3/capacidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CARGA_JSON)
                        .with(authentication(autenticado(UUID.randomUUID(), Rol.GUIA_TURISTICO))))
                .andExpect(status().isForbidden());
    }

    @Test
    void cargarSinAutenticarEsRechazado() throws Exception {
        mockMvc.perform(put("/api/v1/senderos/3/capacidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CARGA_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cargarConCupoCeroEsRechazadoPorValidacion() throws Exception {
        mockMvc.perform(put("/api/v1/senderos/3/capacidad")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"dias": [{"fecha": "2026-10-26", "cupoMaximo": 0}]}
                                """)
                        .with(authentication(autenticado(UUID.randomUUID(), Rol.ADMINISTRADOR))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void consultarComoAdministradorDevuelveLaCapacidadDelRango() throws Exception {
        LocalDate lunes = LocalDate.of(2026, 10, 26);
        given(capacidadService.consultarDias(lunes, lunes.plusDays(6))).willReturn(List.of(unDia(lunes, 30)));

        mockMvc.perform(get("/api/v1/capacidad")
                        .param("desde", "2026-10-26")
                        .param("hasta", "2026-11-01")
                        .with(authentication(autenticado(UUID.randomUUID(), Rol.ADMINISTRADOR))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fecha").value("2026-10-26"));
    }

    private static CapacidadDiaResponse unDia(LocalDate fecha, int cupo) {
        return new CapacidadDiaResponse(3L, fecha, cupo, (short) 80, 0, cupo, false, UUID.randomUUID());
    }

    private static UsernamePasswordAuthenticationToken autenticado(UUID id, Rol rol) {
        AuthenticatedUser principal = new AuthenticatedUser(id, rol.name().toLowerCase() + "@ecopalacio.co", rol);
        return new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + rol.name())));
    }
}
