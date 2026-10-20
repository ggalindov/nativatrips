package com.nativatrips.backend.asistente.controller;

import com.nativatrips.backend.asistente.dto.ChatRequest;
import com.nativatrips.backend.asistente.dto.ChatResponse;
import com.nativatrips.backend.asistente.service.AsistenteService;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Publico (BUG-04): atiende a cualquier visitante; solo un turista identificado consulta sus reservas. */
@RestController
@RequestMapping("/api/v1/asistente")
public class AsistenteController {

    private final AsistenteService asistenteService;

    public AsistenteController(AsistenteService asistenteService) {
        this.asistenteService = asistenteService;
    }

    @PostMapping("/mensajes")
    public ChatResponse conversar(@Valid @RequestBody ChatRequest request, @AuthenticationPrincipal AuthenticatedUser principal) {
        UUID turistaId = principal != null && principal.rol() == Rol.TURISTA ? principal.id() : null;
        return asistenteService.conversar(request, turistaId);
    }
}
