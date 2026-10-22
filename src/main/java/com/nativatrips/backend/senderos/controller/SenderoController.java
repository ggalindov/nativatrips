package com.nativatrips.backend.senderos.controller;

import com.nativatrips.backend.capacidad.dto.DiaCalendarioResponse;
import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.dto.SenderoRequest;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.service.SenderoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/senderos")
public class SenderoController {

    private final SenderoService senderoService;
    private final ReservaService reservaService;
    private final CapacidadService capacidadService;

    public SenderoController(SenderoService senderoService, ReservaService reservaService, CapacidadService capacidadService) {
        this.senderoService = senderoService;
        this.reservaService = reservaService;
        this.capacidadService = capacidadService;
    }

    @GetMapping
    public List<SenderoResponse> listar() {
        return senderoService.listarActivos();
    }

    @GetMapping("/{id}")
    public SenderoResponse obtener(@PathVariable Long id) {
        return senderoService.obtener(id);
    }

    /** Calendario de los proximos dias (hasta 21) con cupos y si se puede reservar. Publico. */
    @GetMapping("/{id}/calendario")
    public List<DiaCalendarioResponse> calendario(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(defaultValue = "14") int dias) {
        return capacidadService.calendario(id, desde, dias);
    }

    @GetMapping("/{id}/disponibilidad")
    public DisponibilidadResponse disponibilidad(
            @PathVariable Long id, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return reservaService.obtenerDisponibilidad(id, fecha);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<SenderoResponse> crear(@Valid @RequestBody SenderoRequest request) {
        SenderoResponse creado = senderoService.crear(request);
        return ResponseEntity.created(URI.create("/api/v1/senderos/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public SenderoResponse actualizar(@PathVariable Long id, @Valid @RequestBody SenderoRequest request) {
        return senderoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Void> desactivar(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean confirmar) {
        senderoService.desactivar(id, reservaService.contarReservasFuturas(id), confirmar);
        return ResponseEntity.noContent().build();
    }

    /** RF-35: el editor del administrador ve tambien borradores y senderos de baja. */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public List<SenderoResponse> listarParaAdministrador() {
        return senderoService.listarTodos();
    }

    @PostMapping("/{id}/publicacion")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public SenderoResponse publicar(@PathVariable Long id, @RequestParam boolean publicado) {
        return senderoService.cambiarPublicacion(id, publicado);
    }

    @PostMapping(value = "/{id}/fotos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public SenderoResponse agregarFoto(@PathVariable Long id, @RequestPart("foto") MultipartFile foto) {
        return senderoService.agregarFoto(id, foto);
    }

    @DeleteMapping("/{id}/fotos/{fotoId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public SenderoResponse borrarFoto(@PathVariable Long id, @PathVariable UUID fotoId) {
        return senderoService.borrarFoto(id, fotoId);
    }

    /** Publica: las fotos cambian poco y el navegador las guarda un dia. */
    @GetMapping("/{id}/fotos/{fotoId}")
    public ResponseEntity<byte[]> foto(@PathVariable Long id, @PathVariable UUID fotoId) {
        SenderoService.Foto foto = senderoService.foto(id, fotoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipo()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(foto.contenido());
    }
}
