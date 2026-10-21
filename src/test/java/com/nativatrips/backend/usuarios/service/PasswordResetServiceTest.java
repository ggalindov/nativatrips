package com.nativatrips.backend.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.usuarios.model.PasswordResetToken;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.PasswordResetTokenRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** HU-14 criterio 4 (NAT-92): enlace por correo con vencimiento; en la base solo queda el hash. */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    /** 15:00 UTC = 10:00 en Colombia; el enlace vence a las 10:30. */
    private static final Instant AHORA = Instant.parse("2026-10-20T15:00:00Z");
    private static final Pattern ENLACE = Pattern.compile("https://nativatrips\\.co/equipo/recuperar\\?token=([A-Za-z0-9_-]{43})");

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private NotificacionService notificacionService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private Usuario usuario;
    private PasswordResetService servicio;

    @BeforeEach
    void setUp() {
        servicio = new PasswordResetService(usuarioRepository, tokenRepository, passwordEncoder, notificacionService,
                Clock.fixed(AHORA, ZoneOffset.UTC), "https://nativatrips.co/");
        usuario = new Usuario("admin@ecopalacio.co", passwordEncoder.encode("clave-vieja-123"), "Ana Ruiz", Rol.ADMINISTRADOR);
        ReflectionTestUtils.setField(usuario, "id", UUID.randomUUID());
    }

    @Test
    void elCorreoTraeUnEnlaceConVencimientoYLaBaseSoloGuardaElHash() {
        given(usuarioRepository.findByEmail("admin@ecopalacio.co")).willReturn(Optional.of(usuario));

        servicio.solicitarRestablecimiento("admin@ecopalacio.co");

        String token = tokenDelCorreo();
        ArgumentCaptor<PasswordResetToken> guardado = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(guardado.capture());
        assertThat(guardado.getValue().getToken()).isEqualTo(TokenSeguro.hash(token)).isNotEqualTo(token);
        assertThat(guardado.getValue().getExpiraEn()).isEqualTo(AHORA.plus(Duration.ofMinutes(30)));
    }

    @Test
    void elCorreoDiceCuandoVenceEnHoraDeColombia() {
        given(usuarioRepository.findByEmail("admin@ecopalacio.co")).willReturn(Optional.of(usuario));

        servicio.solicitarRestablecimiento("admin@ecopalacio.co");

        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq("admin@ecopalacio.co"), anyString(), cuerpo.capture());
        assertThat(cuerpo.getValue()).contains("30 minutos").contains("10:30").contains("Si no lo pediste");
    }

    @Test
    void unCorreoDesconocidoNoRecibeNadaYNoSeGuardaNada() {
        given(usuarioRepository.findByEmail("nadie@ecopalacio.co")).willReturn(Optional.empty());

        servicio.solicitarRestablecimiento("nadie@ecopalacio.co");

        verify(tokenRepository, never()).save(any());
        verify(notificacionService, never()).enviarCorreo(anyString(), anyString(), anyString());
    }

    @Test
    void pedirUnEnlaceNuevoAnulaLosAnteriores() {
        PasswordResetToken anterior = new PasswordResetToken(usuario.getId(), "hash-anterior", AHORA.plus(Duration.ofMinutes(20)));
        given(usuarioRepository.findByEmail("admin@ecopalacio.co")).willReturn(Optional.of(usuario));
        given(tokenRepository.findByUsuarioIdAndUsadoFalse(usuario.getId())).willReturn(List.of(anterior));

        servicio.solicitarRestablecimiento("admin@ecopalacio.co");

        assertThat(anterior.isUsado()).isTrue();
    }

    @Test
    void conElTokenDelEnlaceSeCambiaLaClaveSeLevantaElBloqueoYElEnlaceNoSirveOtraVez() {
        String token = "token-del-enlace-recibido-por-correo-0123456";
        PasswordResetToken guardado = new PasswordResetToken(usuario.getId(), TokenSeguro.hash(token), AHORA.plusSeconds(60));
        usuario.registrarIntentoFallido(AHORA, 1, Duration.ofMinutes(15));
        given(tokenRepository.findByToken(TokenSeguro.hash(token))).willReturn(Optional.of(guardado));
        given(usuarioRepository.findById(usuario.getId())).willReturn(Optional.of(usuario));

        servicio.restablecerPassword(token, "clave-nueva-456");

        assertThat(passwordEncoder.matches("clave-nueva-456", usuario.getPasswordHash())).isTrue();
        assertThat(usuario.estaBloqueado(AHORA)).isFalse();
        assertThat(guardado.isUsado()).isTrue();
    }

    @Test
    void unEnlaceVencidoOElHashLeidoDeLaBaseNoSirven() {
        String token = "token-del-enlace-recibido-por-correo-0123456";
        PasswordResetToken vencido = new PasswordResetToken(usuario.getId(), TokenSeguro.hash(token), AHORA.minusSeconds(1));
        given(tokenRepository.findByToken(TokenSeguro.hash(token))).willReturn(Optional.of(vencido));

        assertThatThrownBy(() -> servicio.restablecerPassword(token, "clave-nueva-456"))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("pide uno nuevo");
        // Quien lee la tabla solo tiene el hash; usarlo como token da otro hash, que no existe.
        assertThatThrownBy(() -> servicio.restablecerPassword(TokenSeguro.hash(token), "clave-nueva-456"))
                .isInstanceOf(BusinessRuleException.class);
    }

    private String tokenDelCorreo() {
        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq("admin@ecopalacio.co"), anyString(), cuerpo.capture());
        Matcher enlace = ENLACE.matcher(cuerpo.getValue());
        assertThat(enlace.find()).as("el correo trae el enlace al frontend").isTrue();
        return enlace.group(1);
    }
}
