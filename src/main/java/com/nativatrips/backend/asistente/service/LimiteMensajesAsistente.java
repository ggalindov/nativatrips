package com.nativatrips.backend.asistente.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Limite de mensajes al asistente por visitante en una ventana deslizante de una hora (amenaza
 * A-08: cada mensaje tiene costo). Vive en memoria porque el backend corre en una sola instancia;
 * si algun dia se escala a varias, este registro debe pasar a un almacenamiento compartido.
 */
@Component
public class LimiteMensajesAsistente {

    static final Duration VENTANA = Duration.ofHours(1);

    private final int maximoPorVentana;
    private final Clock reloj;
    private final Map<String, Deque<Instant>> mensajesPorVisitante = new ConcurrentHashMap<>();

    public LimiteMensajesAsistente(@Value("${app.asistente.mensajes-por-hora:20}") int maximoPorVentana, Clock reloj) {
        this.maximoPorVentana = maximoPorVentana;
        this.reloj = reloj;
    }

    /** Registra el mensaje si el visitante aun tiene cupo; false si ya lo agoto en la ultima hora. */
    public boolean permitir(String visitante) {
        Instant ahora = reloj.instant();
        Deque<Instant> mensajes = mensajesPorVisitante.computeIfAbsent(visitante, clave -> new ArrayDeque<>());
        synchronized (mensajes) {
            descartarVencidos(mensajes, ahora);
            if (mensajes.size() >= maximoPorVentana) {
                return false;
            }
            mensajes.addLast(ahora);
            return true;
        }
    }

    /** Libera la memoria de los visitantes que ya no tienen mensajes dentro de la ventana. */
    @Scheduled(fixedDelay = 15 * 60 * 1000)
    public void limpiar() {
        Instant ahora = reloj.instant();
        mensajesPorVisitante.entrySet().removeIf(entrada -> {
            synchronized (entrada.getValue()) {
                descartarVencidos(entrada.getValue(), ahora);
                return entrada.getValue().isEmpty();
            }
        });
    }

    int visitantesRegistrados() {
        return mensajesPorVisitante.size();
    }

    private static void descartarVencidos(Deque<Instant> mensajes, Instant ahora) {
        Instant limite = ahora.minus(VENTANA);
        while (!mensajes.isEmpty() && !mensajes.peekFirst().isAfter(limite)) {
            mensajes.pollFirst();
        }
    }
}
