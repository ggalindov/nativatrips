package com.nativatrips.backend.notificaciones.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Envia los avisos por SMTP (Gmail con contrasena de aplicacion en produccion, Mailpit en local).
 *
 * <p>Si hay una transaccion abierta, el correo sale solo cuando esta confirma: asi nadie recibe el
 * codigo de una reserva que al final se revirtio. Un fallo del proveedor se registra y no tumba la
 * operacion que lo origino; la reserva o el cambio de clave ya quedaron guardados.
 */
public class SmtpNotificacionService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(SmtpNotificacionService.class);

    private final JavaMailSender mailSender;
    private final String remitente;

    public SmtpNotificacionService(JavaMailSender mailSender, String remitente) {
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    @Override
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enviar(mensaje);
                }
            });
        } else {
            enviar(mensaje);
        }
    }

    private void enviar(SimpleMailMessage mensaje) {
        String destinatario = LogNotificacionService.enmascarar(mensaje.getTo()[0]);
        try {
            mailSender.send(mensaje);
            log.info("[NOTIFICACION] Enviado a {} | Asunto: {}", destinatario, mensaje.getSubject());
        } catch (MailException ex) {
            log.error("[NOTIFICACION] No se pudo enviar a {} | Asunto: {}", destinatario, mensaje.getSubject(), ex);
        }
    }
}
