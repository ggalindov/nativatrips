package com.nativatrips.backend.notificaciones.service;

import com.nativatrips.backend.common.log.Registro;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Respaldo sin servidor de correo (MAIL_HOST vacio): los avisos quedan en el registro. El asunto
 * y el cuerpo llevan datos que escribio el turista, asi que se limpian para que no puedan
 * falsificar lineas del registro.
 */
public class LogNotificacionService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacionService.class);

    @Override
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        String para = enmascarar(destinatario);
        log.info("[NOTIFICACION] Para: {} | Asunto: {}", para, Registro.limpio(asunto));
        // El cuerpo lleva enlaces con token (recuperacion, mi reserva): solo en DEBUG, apagado por
        // defecto. En local se ve con LOGGING_LEVEL_COM_NATIVATRIPS_BACKEND_NOTIFICACIONES=DEBUG.
        if (log.isDebugEnabled()) {
            log.debug("[NOTIFICACION] Cuerpo para {}: {}", para, Registro.limpio(cuerpo));
        }
    }

    /** {@code juana.perez@correo.co} queda como {@code j***@correo.co}, sin saltos de linea. */
    static String enmascarar(String correo) {
        int arroba = correo == null ? -1 : correo.indexOf('@');
        if (arroba < 1) {
            return "***";
        }
        return Registro.limpio(correo.charAt(0) + "***" + correo.substring(arroba));
    }
}
