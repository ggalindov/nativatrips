package com.nativatrips.backend.panel.controller;

import com.nativatrips.backend.panel.service.EventosPanel;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** RF-08 y RF-26: el panel del administrador recibe en vivo las reservas nuevas y las alertas de aforo. */
@RestController
@RequestMapping("/api/v1/panel")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class PanelController {

    private final EventosPanel eventosPanel;

    public PanelController(EventosPanel eventosPanel) {
        this.eventosPanel = eventosPanel;
    }

    @GetMapping(value = "/eventos", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter eventos() {
        return eventosPanel.suscribir();
    }
}
