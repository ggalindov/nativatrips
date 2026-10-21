package com.nativatrips.backend.notificaciones.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class SmtpNotificacionServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final SmtpNotificacionService servicio =
            new SmtpNotificacionService(mailSender, "Eco Palacio <reservas@ecopalacio.co>");

    @AfterEach
    void limpiarTransaccion() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void sinTransaccionEnviaDeInmediatoConRemitenteYContenido() {
        servicio.enviarCorreo("juana@correo.co", "Tu reserva NT-ABC123", "Hola Juana");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage enviado = captor.getValue();
        assertThat(enviado.getFrom()).isEqualTo("Eco Palacio <reservas@ecopalacio.co>");
        assertThat(enviado.getTo()).containsExactly("juana@correo.co");
        assertThat(enviado.getSubject()).isEqualTo("Tu reserva NT-ABC123");
        assertThat(enviado.getText()).isEqualTo("Hola Juana");
    }

    @Test
    void conTransaccionEsperaALaConfirmacion() {
        TransactionSynchronizationManager.initSynchronization();

        servicio.enviarCorreo("juana@correo.co", "Asunto", "Cuerpo");
        verify(mailSender, never()).send(any(SimpleMailMessage.class));

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void siLaTransaccionSeRevierteNoSaleNingunCorreo() {
        TransactionSynchronizationManager.initSynchronization();

        servicio.enviarCorreo("juana@correo.co", "Asunto", "Cuerpo");
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(s -> s.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void unFalloDelProveedorNoSePropaga() {
        doThrow(new MailSendException("smtp caido")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatCode(() -> servicio.enviarCorreo("juana@correo.co", "Asunto", "Cuerpo"))
                .doesNotThrowAnyException();
    }
}
