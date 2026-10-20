package com.nativatrips.backend.pagos.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.config.SecurityConfig;
import com.nativatrips.backend.pagos.dto.IniciarPagoResponse;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.pasarela.PayuPasarela;
import com.nativatrips.backend.pagos.pasarela.ResultadoPago;
import com.nativatrips.backend.pagos.service.PagoService;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PagoController.class)
@Import({SecurityConfig.class, PagoControllerTest.TestSecurityBeans.class})
class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PagoService pagoService;

    @MockitoBean
    private PayuPasarela payuPasarela;

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
    void iniciarPagoSinAutenticarEsRechazado() throws Exception {
        mockMvc.perform(post("/api/v1/reservas/" + UUID.randomUUID() + "/pago"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void iniciarPagoComoTuristaEsAceptado() throws Exception {
        given(pagoService.iniciarPago(any(), any(), anyString())).willReturn(new IniciarPagoResponse(
                "https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/",
                "508029", "512321", "desc", "REF-1", "50000.0", "0", "0", "COP",
                "firma", "1", "turista@example.com", "http://localhost/r", "http://localhost/c"));

        mockMvc.perform(post("/api/v1/reservas/" + UUID.randomUUID() + "/pago")
                        .with(authentication(unTuristaAutenticado())))
                .andExpect(status().isOk());
    }

    @Test
    void confirmacionWebhookNoRequiereAutenticacion() throws Exception {
        given(payuPasarela.verificar(any())).willReturn(new ResultadoPago(
                "REF-1", "TX-1", EstadoPago.APROBADO, new java.math.BigDecimal("50000.0"), "COP", "detalle", "{}"));

        mockMvc.perform(post("/api/v1/pagos/confirmacion")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("reference_sale", "REF-1")
                        .param("value", "50000.0")
                        .param("currency", "COP")
                        .param("state_pol", "4")
                        .param("sign", "firma")
                        .param("transaction_id", "TX-1"))
                .andExpect(status().isOk());
        org.mockito.Mockito.verify(pagoService).aplicarResultado(any());
    }

    private static UsernamePasswordAuthenticationToken unTuristaAutenticado() {
        AuthenticatedUser principal = new AuthenticatedUser(UUID.randomUUID(), "turista@example.com", Rol.TURISTA);
        return new UsernamePasswordAuthenticationToken(
                principal, null, List.of(new SimpleGrantedAuthority("ROLE_TURISTA")));
    }
}
