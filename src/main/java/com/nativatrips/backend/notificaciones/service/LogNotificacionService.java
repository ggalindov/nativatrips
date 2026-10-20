package com.nativatrips.backend.notificaciones.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LogNotificacionService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacionService.class);

    @Override
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        log.info("[NOTIFICACION] Para: {} | Asunto: {}", enmascarar(destinatario), asunto);
        // El cuerpo lleva enlaces con token (recuperacion, mi reserva): solo en DEBUG, apagado por
        // defecto. En local se ve con LOGGING_LEVEL_COM_NATIVATRIPS_BACKEND_NOTIFICACIONES=DEBUG.
        log.debug("[NOTIFICACION] Cuerpo para {}: {}", enmascarar(destinatario), cuerpo);
    }

    /** {@code juana.perez@correo.co} queda como {@code j***@correo.co}. */
    static String enmascarar(String correo) {
        int arroba = correo == null ? -1 : correo.indexOf('@');
        if (arroba < 1) {
            return "***";
        }
        return correo.charAt(0) + "***" + correo.substring(arroba);
    }
}
