package com.nativatrips.backend.panel.service;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * RF-08: canal en vivo hacia el panel del equipo (Server-Sent Events). Cada pestana abierta del
 * panel es una suscripcion; los eventos salen solo cuando la transaccion que los origina confirma,
 * para que nadie vea una reserva que al final se revirtio.
 */
@Component
public class EventosPanel {

    /** Una suscripcion dura 30 minutos; el navegador se vuelve a conectar solo. */
    static final long DURACION_MS = 30 * 60 * 1000L;

    private static final Logger log = LoggerFactory.getLogger(EventosPanel.class);

    private final List<SseEmitter> suscripciones = new CopyOnWriteArrayList<>();

    public SseEmitter suscribir() {
        SseEmitter emisor = new SseEmitter(DURACION_MS);
        suscripciones.add(emisor);
        emisor.onCompletion(() -> suscripciones.remove(emisor));
        emisor.onTimeout(() -> suscripciones.remove(emisor));
        emisor.onError(e -> suscripciones.remove(emisor));
        enviar(emisor, "conectado", "{}");
        return emisor;
    }

    /** Publica el evento al confirmar la transaccion en curso, o de inmediato si no hay ninguna. */
    public void publicar(String tipo, Object datos) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    difundir(tipo, datos);
                }
            });
        } else {
            difundir(tipo, datos);
        }
    }

    /** Comentario SSE cada 25 s: mantiene viva la conexion a traves de Nginx y de los proxies. */
    @Scheduled(fixedRate = 25_000)
    void latido() {
        for (SseEmitter emisor : suscripciones) {
            try {
                emisor.send(SseEmitter.event().comment("latido"));
            } catch (IOException | IllegalStateException e) {
                suscripciones.remove(emisor);
            }
        }
    }

    int suscritos() {
        return suscripciones.size();
    }

    private void difundir(String tipo, Object datos) {
        for (SseEmitter emisor : suscripciones) {
            enviar(emisor, tipo, datos);
        }
    }

    private void enviar(SseEmitter emisor, String tipo, Object datos) {
        try {
            emisor.send(SseEmitter.event().name(tipo).data(datos, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException e) {
            log.debug("Suscripcion del panel cerrada: {}", e.getMessage());
            suscripciones.remove(emisor);
        }
    }
}
