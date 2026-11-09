package com.nativatrips.backend.usuarios.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import java.util.List;
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

@WebMvcTest(UsuarioController.class)
@Import({SecurityConfig.class, UsuarioControllerTest.TestSecurityBeans.class})
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

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

    private static Usuario guia(String nombre, String correo) {
        return new Usuario(correo, "hash", nombre, Rol.GUIA_TURISTICO);
    }

    @Test
    void sinSesionNoHayGuias() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/guias")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "GUIA_TURISTICO")
    void elGuiaNoVeLaListaDeGuias() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/guias")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void elAdministradorVeLosGuiasActivosEnOrdenAlfabetico() throws Exception {
        given(usuarioRepository.findByRolAndActivoTrue(Rol.GUIA_TURISTICO))
                .willReturn(List.of(guia("Marta León", "marta@ecopalacio.co"), guia("andrés Castro", "andres@ecopalacio.co")));

        mockMvc.perform(get("/api/v1/usuarios/guias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nombreCompleto").value("andrés Castro"))
                .andExpect(jsonPath("$[1].email").value("marta@ecopalacio.co"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }
}
