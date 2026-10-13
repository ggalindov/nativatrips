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
import java.util.UUID;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import jakarta.persistence.EntityListeners;

/** Registro append-only de cada transicion de estado de una reserva (RNF-13). */
@Entity
@Table(name = "reserva_estado_historial")
@EntityListeners(AuditingEntityListener.class)
public class ReservaEstadoHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior")
    private EstadoReserva estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false)
    private EstadoReserva estadoNuevo;

    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrigenCambioEstado origen;

    @Column(name = "cambiado_por_usuario_id")
    private UUID cambiadoPorUsuarioId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ReservaEstadoHistorial() {
        // requerido por JPA
    }

    public ReservaEstadoHistorial(
            UUID reservaId,
            EstadoReserva estadoAnterior,
            EstadoReserva estadoNuevo,
            String motivo,
            OrigenCambioEstado origen,
            UUID cambiadoPorUsuarioId) {
        this.reservaId = reservaId;
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.motivo = motivo;
        this.origen = origen;
        this.cambiadoPorUsuarioId = cambiadoPorUsuarioId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public EstadoReserva getEstadoAnterior() {
        return estadoAnterior;
    }

    public EstadoReserva getEstadoNuevo() {
        return estadoNuevo;
    }

    public String getMotivo() {
        return motivo;
    }

    public OrigenCambioEstado getOrigen() {
        return origen;
    }

    public UUID getCambiadoPorUsuarioId() {
        return cambiadoPorUsuarioId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
