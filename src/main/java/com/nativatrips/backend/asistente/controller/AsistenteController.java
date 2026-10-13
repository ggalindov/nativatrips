package com.nativatrips.backend.asistente.controller;

import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.service.AsistenteService;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/asistente")
@PreAuthorize("hasRole('TURISTA')")
public class AsistenteController {

    private final AsistenteService asistenteService;

    public AsistenteController(AsistenteService asistenteService) {
        this.asistenteService = asistenteService;
    }

    @PostMapping("/mensajes")
    public ChatResponse conversar(@Valid @RequestBody ChatRequest request, @AuthenticationPrincipal AuthenticatedUser principal) {
        return asistenteService.conversar(request, principal.id());
    }
}
