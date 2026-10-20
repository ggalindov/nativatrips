package com.nativatrips.backend.pagos.model;

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

/** Evento de la pasarela ya aplicado; el par transaccion + estado es unico (idempotencia, ADR-005). */
@Entity
@Table(name = "eventos_pago")
public class EventoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pago_id", nullable = false)
    private UUID pagoId;

    @Column(name = "transaccion_id", nullable = false)
    private String transaccionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estado;

    @Column(name = "recibido_en", nullable = false)
    private Instant recibidoEn;

    protected EventoPago() {
        // requerido por JPA
    }

    public EventoPago(UUID pagoId, String transaccionId, EstadoPago estado, Instant recibidoEn) {
        this.pagoId = pagoId;
        this.transaccionId = transaccionId;
        this.estado = estado;
        this.recibidoEn = recibidoEn;
    }

    public UUID getPagoId() {
        return pagoId;
    }

    public String getTransaccionId() {
        return transaccionId;
    }

    public EstadoPago getEstado() {
        return estado;
    }
}
