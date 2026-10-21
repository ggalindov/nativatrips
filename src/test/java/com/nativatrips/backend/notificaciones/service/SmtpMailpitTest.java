package com.nativatrips.backend.notificaciones.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** El correo sale de verdad por SMTP y llega al buzon (Mailpit), con tildes intactas. */
@Testcontainers(disabledWithoutDocker = true)
class SmtpMailpitTest {

    @Container
    static final GenericContainer<?> MAILPIT = new GenericContainer<>("axllent/mailpit:v1.31.3")
            .withExposedPorts(1025, 8025)
            .waitingFor(Wait.forHttp("/livez").forPort(8025));

    @Test
    void elCorreoLlegaAlBuzon() throws Exception {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(MAILPIT.getHost());
        sender.setPort(MAILPIT.getMappedPort(1025));
        sender.setDefaultEncoding("UTF-8");
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "false");
        props.put("mail.smtp.starttls.enable", "false");

        new SmtpNotificacionService(sender, "reservas@ecopalacio.co")
                .enviarCorreo("juana@correo.co", "Recuperación de contraseña", "Abre el enlace: https://ejemplo/equipo/recuperar?token=abc");

        HttpResponse<String> respuesta = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(
                                "http://" + MAILPIT.getHost() + ":" + MAILPIT.getMappedPort(8025) + "/api/v1/messages"))
                        .timeout(Duration.ofSeconds(5))
                        .build(),
                HttpResponse.BodyHandlers.ofString());

        assertThat(respuesta.statusCode()).isEqualTo(200);
        assertThat(respuesta.body())
                .contains("\"total\":1")
                .contains("juana@correo.co")
                .contains("reservas@ecopalacio.co")
                .contains("Recuperación de contraseña");
    }
}
