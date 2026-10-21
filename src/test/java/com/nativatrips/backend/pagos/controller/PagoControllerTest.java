package com.nativatrips.backend.pagos.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.pagos.pasarela.CheckoutWompi;
import com.nativatrips.backend.pagos.service.PagoService;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PagoController.class)
@Import({SecurityConfig.class, PagoControllerTest.TestSecurityBeans.class})
class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PagoService pagoService;

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
    void elTitularPagaDesdeElEnlaceSinSesion() throws Exception {
        given(pagoService.iniciarPagoConEnlace(eq("token-del-enlace"), any())).willReturn(new CheckoutWompi(
                "https://checkout.wompi.co/p/?reference=NT-1", "pub_test", "NT-1", 4_500_000L, "COP", "firma",
                Instant.parse("2026-10-20T15:15:00Z"), "http://localhost:3000/mi-reserva/resultado-pago"));

        mockMvc.perform(post("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", "token-del-enlace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("https://checkout.wompi.co/p/?reference=NT-1"))
                .andExpect(jsonPath("$.montoEnCentavos").value(4_500_000));
    }

    @Test
    void sinPagosTodaviaLaConsultaRespondeNoEncontrado() throws Exception {
        given(pagoService.ultimoPagoConEnlace(eq("token-del-enlace"), any())).willReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/mi-reserva/pago").header("X-Enlace-Reserva", "token-del-enlace"))
                .andExpect(status().isNotFound());
    }

    @Test
    void elPagoConSesionDeTuristaYElWebhookAnteriorYaNoExisten() throws Exception {
        mockMvc.perform(post("/api/v1/reservas/" + UUID.randomUUID() + "/pago").with(authentication(unTurista())))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/pagos/confirmacion").with(authentication(unTurista())))
                .andExpect(status().isNotFound());
    }

    private static UsernamePasswordAuthenticationToken unTurista() {
        AuthenticatedUser principal = new AuthenticatedUser(UUID.randomUUID(), "turista@example.com", Rol.TURISTA);
        return new UsernamePasswordAuthenticationToken(principal, null, List.of(new SimpleGrantedAuthority("ROLE_TURISTA")));
    }
}
