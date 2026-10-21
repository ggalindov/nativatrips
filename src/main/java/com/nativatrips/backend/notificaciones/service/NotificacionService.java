package com.nativatrips.backend.notificaciones.service;

/**
 * Abstraccion de envio de notificaciones. {@code NotificacionesConfig} elige la implementacion:
 * SMTP ({@link SmtpNotificacionService}) cuando hay MAIL_HOST y el registro
 * ({@link LogNotificacionService}) cuando no.
 */
public interface NotificacionService {

    void enviarCorreo(String destinatario, String asunto, String cuerpo);
}
