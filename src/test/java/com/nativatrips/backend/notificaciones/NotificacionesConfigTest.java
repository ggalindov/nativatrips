package com.nativatrips.backend.notificaciones;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.nativatrips.backend.notificaciones.service.LogNotificacionService;
import com.nativatrips.backend.notificaciones.service.SmtpNotificacionService;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

class NotificacionesConfigTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);

    @Test
    void sinHostUsaElRegistro() {
        assertThat(NotificacionesConfig.elegir(mailSender, "", "", "")).isInstanceOf(LogNotificacionService.class);
        assertThat(NotificacionesConfig.elegir(null, "smtp.gmail.com", "a@b.co", "")).isInstanceOf(LogNotificacionService.class);
    }

    @Test
    void conHostUsaSmtp() {
        assertThat(NotificacionesConfig.elegir(mailSender, "smtp.gmail.com", "reservas@gmail.com", ""))
                .isInstanceOf(SmtpNotificacionService.class);
    }

    @Test
    void conHostPeroSinRemitenteNiUsuarioNoArranca() {
        assertThatThrownBy(() -> NotificacionesConfig.elegir(mailSender, "mailpit", "", ""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MAIL_REMITENTE");
    }
}
