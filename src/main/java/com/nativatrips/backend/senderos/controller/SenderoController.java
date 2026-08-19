package com.nativatrips.backend.senderos.controller;

import com.nativatrips.backend.senderos.dto.SenderoRequest;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.service.SenderoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/senderos")
public class SenderoController {

    private final SenderoService senderoService;

    public SenderoController(SenderoService senderoService) {
        this.senderoService = senderoService;
    }

    @GetMapping
    public List<SenderoResponse> listar() {
        return senderoService.listarActivos();
    }

    @GetMapping("/{id}")
    public SenderoResponse obtener(@PathVariable Long id) {
        return senderoService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
    public ResponseEntity<SenderoResponse> crear(@Valid @RequestBody SenderoRequest request) {
        SenderoResponse creado = senderoService.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/senderos/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
    public SenderoResponse actualizar(@PathVariable Long id, @Valid @RequestBody SenderoRequest request) {
        return senderoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        senderoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
