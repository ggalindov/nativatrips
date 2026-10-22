package com.nativatrips.backend.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** RF-37 (Anexo 16): pedido de nueva fecha con causal y soporte; queda como registro auditable de la decision. */
@Entity
@Table(name = "solicitudes_reprogramacion")
public class SolicitudReprogramacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CausalReprogramacion causal;

    @Column(nullable = false)
    private String descripcion;

    @Column(name = "fecha_original", nullable = false)
    private LocalDate fechaOriginal;

    @Column(name = "fecha_deseada", nullable = false)
    private LocalDate fechaDeseada;

    @Column(name = "soporte_ruta", nullable = false)
    private String soporteRuta;

    @Column(name = "soporte_tipo", nullable = false)
    private String soporteTipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSolicitudReprogramacion estado = EstadoSolicitudReprogramacion.PENDIENTE;

    @Column(name = "decidida_por_usuario_id")
    private UUID decididaPorUsuarioId;

    @Column(name = "decidida_en")
    private Instant decididaEn;

    @Column(name = "motivo_decision")
    private String motivoDecision;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SolicitudReprogramacion() {
        // requerido por JPA
    }

    public SolicitudReprogramacion(
            UUID reservaId, CausalReprogramacion causal, String descripcion, LocalDate fechaOriginal,
            LocalDate fechaDeseada, String soporteRuta, String soporteTipo, Instant creadaEn) {
        this.reservaId = reservaId;
        this.causal = causal;
        this.descripcion = descripcion;
        this.fechaOriginal = fechaOriginal;
        this.fechaDeseada = fechaDeseada;
        this.soporteRuta = soporteRuta;
        this.soporteTipo = soporteTipo;
        this.createdAt = creadaEn;
    }

    public void decidir(boolean aprobada, UUID adminId, String motivo, Instant cuando) {
        this.estado = aprobada ? EstadoSolicitudReprogramacion.APROBADA : EstadoSolicitudReprogramacion.RECHAZADA;
        this.decididaPorUsuarioId = adminId;
        this.motivoDecision = motivo;
        this.decididaEn = cuando;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public CausalReprogramacion getCausal() {
        return causal;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public LocalDate getFechaOriginal() {
        return fechaOriginal;
    }

    public LocalDate getFechaDeseada() {
        return fechaDeseada;
    }

    public String getSoporteRuta() {
        return soporteRuta;
    }

    public String getSoporteTipo() {
        return soporteTipo;
    }

    public EstadoSolicitudReprogramacion getEstado() {
        return estado;
    }

    public String getMotivoDecision() {
        return motivoDecision;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
