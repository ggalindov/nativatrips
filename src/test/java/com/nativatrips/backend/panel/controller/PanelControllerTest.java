package com.nativatrips.backend.panel.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.panel.service.EventosPanel;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@WebMvcTest(PanelController.class)
@Import({SecurityConfig.class, PanelControllerTest.TestSecurityBeans.class})
class PanelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventosPanel eventosPanel;

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
    void sinSesionNoHayEventos() throws Exception {
        mockMvc.perform(get("/api/v1/panel/eventos")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "GUIA_TURISTICO")
    void elGuiaNoRecibeLosEventosDelPanel() throws Exception {
        mockMvc.perform(get("/api/v1/panel/eventos")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void elAdministradorSeSuscribe() throws Exception {
        given(eventosPanel.suscribir()).willReturn(new SseEmitter());

        mockMvc.perform(get("/api/v1/panel/eventos")).andExpect(request().asyncStarted());
    }
}
