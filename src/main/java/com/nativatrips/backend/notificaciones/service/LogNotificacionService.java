package com.nativatrips.backend.notificaciones.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LogNotificacionService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacionService.class);

    @Override
    public void enviarCorreo(String destinatario, String asunto, String cuerpo) {
        log.info("[NOTIFICACION] Para: {} | Asunto: {} | Cuerpo: {}", destinatario, asunto, cuerpo);
    }
}
