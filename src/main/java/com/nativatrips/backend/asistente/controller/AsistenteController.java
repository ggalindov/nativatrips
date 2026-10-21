package com.nativatrips.backend.asistente.controller;

import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.service.AsistenteService;
import com.nativatrips.backend.asistente.service.LimiteMensajesAsistente;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Publico (BUG-04): atiende a cualquier visitante. Las reservas se consultan con el enlace del correo. */
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
            @Valid @RequestBody ChatRequest request, HttpServletRequest http) {
        // La IP real llega en X-Forwarded-For desde Nginx (server.forward-headers-strategy).
        if (!limiteMensajes.permitir(http.getRemoteAddr())) {
            throw new BusinessRuleException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Has enviado muchos mensajes seguidos. Escribenos de nuevo en un rato.");
        }
        return asistenteService.conversar(request);
    }
}
