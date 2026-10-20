package com.nativatrips.backend.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.TokenRevocado;
import com.nativatrips.backend.usuarios.repository.TokenRevocadoRepository;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RevocacionTokensTest {

    private static final Instant AHORA = Instant.parse("2026-10-20T15:00:00Z");

    @Mock
    private TokenRevocadoRepository repositorio;

    private JwtTokenProvider jwtTokenProvider;
    private RevocacionTokens revocacion;

    @BeforeEach
    void setUp() {
        JwtProperties propiedades = new JwtProperties();
        propiedades.setSecret("test-only-secret-not-for-production-min-32-bytes-long");
        propiedades.setExpirationMinutes(60);
        jwtTokenProvider = new JwtTokenProvider(propiedades);
        org.springframework.test.util.ReflectionTestUtils.invokeMethod(jwtTokenProvider, "init");
        revocacion = new RevocacionTokens(repositorio, jwtTokenProvider, Clock.fixed(AHORA, ZoneOffset.UTC));
    }

    @Test
    void revocarGuardaElIdentificadorDelTokenHastaSuVencimiento() {
        String token = jwtTokenProvider.generarToken(UUID.randomUUID(), "admin@ecopalacio.co", Rol.ADMINISTRADOR);
        var claims = jwtTokenProvider.validarYObtenerClaims(token);

        revocacion.revocar(token);

        ArgumentCaptor<TokenRevocado> guardado = ArgumentCaptor.forClass(TokenRevocado.class);
        verify(repositorio).save(guardado.capture());
        assertThat(guardado.getValue().getJti()).isEqualTo(jwtTokenProvider.obtenerJti(claims));
        assertThat(guardado.getValue().getExpiraEn()).isEqualTo(claims.getExpiration().toInstant());
        assertThat(guardado.getValue().getRevocadoEn()).isEqualTo(AHORA);
    }

    @Test
    void cadaTokenTieneUnIdentificadorDistinto() {
        UUID usuario = UUID.randomUUID();
        String uno = jwtTokenProvider.generarToken(usuario, "admin@ecopalacio.co", Rol.ADMINISTRADOR);
        String otro = jwtTokenProvider.generarToken(usuario, "admin@ecopalacio.co", Rol.ADMINISTRADOR);

        assertThat(jwtTokenProvider.obtenerJti(jwtTokenProvider.validarYObtenerClaims(uno)))
                .isNotEqualTo(jwtTokenProvider.obtenerJti(jwtTokenProvider.validarYObtenerClaims(otro)));
    }

    @Test
    void revocarUnTokenInvalidoNoGuardaNada() {
        revocacion.revocar("no-es-un-jwt");

        verify(repositorio, never()).save(any());
    }

    @Test
    void revocarDosVecesElMismoTokenLoGuardaUnaSolaVez() {
        String token = jwtTokenProvider.generarToken(UUID.randomUUID(), "admin@ecopalacio.co", Rol.ADMINISTRADOR);
        given(repositorio.existsById(any())).willReturn(true);

        revocacion.revocar(token);

        verify(repositorio, never()).save(any());
    }

    @Test
    void laLimpiezaBorraLosRevocadosQueYaVencieron() {
        revocacion.limpiarVencidos();

        verify(repositorio).borrarVencidosAntesDe(AHORA);
    }
}
