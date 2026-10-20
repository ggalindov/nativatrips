package com.nativatrips.backend.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.lenient;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.usuarios.dto.LoginRequest;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import com.nativatrips.backend.usuarios.security.JwtTokenProvider;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** HU-14 criterio 6 (NAT-92), amenaza A-04: cinco intentos fallidos seguidos bloquean 15 minutos. */
@ExtendWith(MockitoExtension.class)
class AuthServiceBloqueoTest {

    private static final String CORREO = "admin@ecopalacio.co";
    private static final String CLAVE = "clave-segura-123";

    /** Reloj que la prueba adelanta a mano. */
    private static final class RelojManual extends Clock {
        private Instant ahora = Instant.parse("2026-10-20T15:00:00Z");

        void adelantar(Duration tiempo) {
            ahora = ahora.plus(tiempo);
        }

        @Override
        public Instant instant() {
            return ahora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zona) {
            return this;
        }
    }

    @Mock
    private UsuarioRepository usuarioRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final RelojManual reloj = new RelojManual();
    private Usuario usuario;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        JwtProperties propiedades = new JwtProperties();
        propiedades.setSecret("test-only-secret-not-for-production-min-32-bytes-long");
        propiedades.setExpirationMinutes(60);
        JwtTokenProvider jwtTokenProvider = new JwtTokenProvider(propiedades);
        ReflectionTestUtils.invokeMethod(jwtTokenProvider, "init");
        authService = new AuthService(usuarioRepository, passwordEncoder, jwtTokenProvider, propiedades, reloj, 5, 15);

        usuario = new Usuario(CORREO, passwordEncoder.encode(CLAVE), "Administrador", Rol.ADMINISTRADOR);
        ReflectionTestUtils.setField(usuario, "id", UUID.randomUUID());
        lenient().when(usuarioRepository.findByEmailConBloqueo(CORREO)).thenReturn(Optional.of(usuario));
    }

    @Test
    void cuatroIntentosFallidosNoBloquean() {
        fallar(4);

        assertThat(usuario.estaBloqueado(reloj.instant())).isFalse();
        assertThat(authService.login(new LoginRequest(CORREO, CLAVE)).accessToken()).isNotBlank();
    }

    @Test
    void elQuintoIntentoFallidoBloqueaAunqueLuegoLlegueLaClaveCorrecta() {
        fallar(5);

        assertThat(usuario.getBloqueadoHasta()).isEqualTo(reloj.instant().plus(Duration.ofMinutes(15)));
        assertThatThrownBy(() -> authService.login(new LoginRequest(CORREO, CLAVE)))
                .isInstanceOfSatisfying(BusinessRuleException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(ex.getMessage()).isEqualTo(AuthService.CREDENCIALES_INVALIDAS);
                });
    }

    @Test
    void elBloqueoTerminaALosQuinceMinutos() {
        fallar(5);

        reloj.adelantar(Duration.ofMinutes(14).plusSeconds(59));
        assertThatThrownBy(() -> authService.login(new LoginRequest(CORREO, CLAVE)))
                .isInstanceOf(BusinessRuleException.class);

        reloj.adelantar(Duration.ofSeconds(1));
        assertThat(authService.login(new LoginRequest(CORREO, CLAVE)).accessToken()).isNotBlank();
        assertThat(usuario.getBloqueadoHasta()).isNull();
    }

    @Test
    void unInicioCorrectoReiniciaElConteo() {
        fallar(4);
        authService.login(new LoginRequest(CORREO, CLAVE));
        fallar(4);

        assertThat(usuario.getIntentosFallidos()).isEqualTo(4);
        assertThat(usuario.estaBloqueado(reloj.instant())).isFalse();
    }

    @Test
    void losIntentosDuranteElBloqueoNoLoAlargan() {
        fallar(5);
        Instant bloqueadoHasta = usuario.getBloqueadoHasta();

        reloj.adelantar(Duration.ofMinutes(10));
        fallar(3);

        assertThat(usuario.getBloqueadoHasta()).isEqualTo(bloqueadoHasta);
    }

    @Test
    void correoDesconocidoRecibeElMismoMensaje() {
        given(usuarioRepository.findByEmailConBloqueo("nadie@ecopalacio.co")).willReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("nadie@ecopalacio.co", CLAVE)))
                .hasMessage(AuthService.CREDENCIALES_INVALIDAS);
    }

    private void fallar(int veces) {
        for (int i = 0; i < veces; i++) {
            assertThatThrownBy(() -> authService.login(new LoginRequest(CORREO, "clave-equivocada")))
                    .hasMessage(AuthService.CREDENCIALES_INVALIDAS);
        }
    }
}
