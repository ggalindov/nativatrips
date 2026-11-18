package com.nativatrips.backend.notificaciones.service;

import com.nativatrips.backend.common.log.Registro;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Respaldo sin servidor de correo (MAIL_HOST vacio): los avisos quedan en el registro. El asunto
 * lleva datos que escribio el turista, asi que se limpia para que no pueda falsificar lineas; el
 * cuerpo no se escribe porque lleva enlaces con token.
 */
public class LogNotificacionService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacionService.class);

    @Override
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        String para = enmascarar(destinatario);
        log.info("[NOTIFICACION] Para: {} | Asunto: {}", para, Registro.limpio(asunto));
        // El cuerpo lleva enlaces con token (recuperacion de la clave, mi reserva): nunca se escribe
        // en el registro. Para ver los correos en desarrollo esta Mailpit en el docker compose.
        log.debug("[NOTIFICACION] Cuerpo omitido ({} caracteres)", cuerpo == null ? 0 : cuerpo.length());
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
