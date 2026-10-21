package com.nativatrips.backend.notificaciones;

import com.nativatrips.backend.notificaciones.service.LogNotificacionService;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.notificaciones.service.SmtpNotificacionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

/** Elige el canal de correo: SMTP cuando hay MAIL_HOST, el registro cuando no. */
@Configuration
public class NotificacionesConfig {

    private static final Logger log = LoggerFactory.getLogger(NotificacionesConfig.class);

    @Bean
    NotificacionService notificacionService(
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.username:}") String usuario,
            @Value("${app.correo.remitente:}") String remitente) {
        return elegir(mailSender.getIfAvailable(), host, usuario, remitente);
    }

    static NotificacionService elegir(JavaMailSender mailSender, String host, String usuario, String remitente) {
        if (mailSender == null || host == null || host.isBlank()) {
            log.warn("Sin MAIL_HOST: los correos no se envian, solo se registran en el log");
            return new LogNotificacionService();
        }
        String desde = remitente != null && !remitente.isBlank() ? remitente : usuario;
        if (desde == null || desde.isBlank()) {
            throw new IllegalStateException("Con MAIL_HOST hace falta MAIL_REMITENTE o MAIL_USUARIO para el remitente");
        }
        return new SmtpNotificacionService(mailSender, desde);
    }
}
