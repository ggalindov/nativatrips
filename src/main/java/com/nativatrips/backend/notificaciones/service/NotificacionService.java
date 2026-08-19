package com.nativatrips.backend.notificaciones.service;

/**
 * Abstraccion de envio de notificaciones. La implementacion inicial solo registra en el log
 * (LogNotificacionService); se reemplaza por un proveedor de correo real sin tocar quien la usa.
 */
public interface NotificacionService {

    void enviarCorreo(String destinatario, String asunto, String cuerpo);
}
