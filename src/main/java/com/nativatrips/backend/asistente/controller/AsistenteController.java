package com.nativatrips.backend.asistente.controller;

import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.service.AsistenteService;
import com.nativatrips.backend.asistente.service.AsistenteTools;
import com.nativatrips.backend.asistente.service.LimiteMensajesAsistente;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Publico (BUG-04): atiende a cualquier visitante. Si llega el enlace de la reserva en la misma
 * cabecera que usa «mi reserva», el asistente puede responder sobre esa reserva y ninguna otra.
 */
@RestController
@RequestMapping("/api/v1/asistente")
public class AsistenteController {

    private final AsistenteService asistenteService;
    private final LimiteMensajesAsistente limiteMensajes;

    public AsistenteController(AsistenteService asistenteService, LimiteMensajesAsistente limiteMensajes) {
        this.asistenteService = asistenteService;
        this.limiteMensajes = limiteMensajes;
    }

    @PostMapping("/mensajes")
    public ChatResponse conversar(
            @Valid @RequestBody ChatRequest request,
            @RequestHeader(value = "X-Enlace-Reserva", required = false) String enlaceReserva,
            HttpServletRequest http) {
        // La IP real llega en X-Forwarded-For desde Nginx (server.forward-headers-strategy).
        if (!limiteMensajes.permitir(http.getRemoteAddr())) {
            throw new BusinessRuleException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Has enviado muchos mensajes seguidos. Escribenos de nuevo en un rato.");
        }
        return asistenteService.conversar(request, new AsistenteTools.Contexto(enlaceReserva, http.getRemoteAddr()));
    }
}
