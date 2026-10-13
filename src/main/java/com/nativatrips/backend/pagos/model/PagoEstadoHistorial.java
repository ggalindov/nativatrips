package com.nativatrips.backend.pagos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
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

/** Registro append-only de cada transicion de estado de un pago (RNF-13). */
@Entity
@Table(name = "pago_estado_historial")
@EntityListeners(AuditingEntityListener.class)
public class PagoEstadoHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pago_id", nullable = false)
    private UUID pagoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior")
    private EstadoPago estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false)
    private EstadoPago estadoNuevo;

    private String motivo;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PagoEstadoHistorial() {
        // requerido por JPA
    }

    public PagoEstadoHistorial(UUID pagoId, EstadoPago estadoAnterior, EstadoPago estadoNuevo, String motivo) {
        this.pagoId = pagoId;
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.motivo = motivo;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPagoId() {
        return pagoId;
    }

    public EstadoPago getEstadoAnterior() {
        return estadoAnterior;
    }

    public EstadoPago getEstadoNuevo() {
        return estadoNuevo;
    }

    public String getMotivo() {
        return motivo;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
