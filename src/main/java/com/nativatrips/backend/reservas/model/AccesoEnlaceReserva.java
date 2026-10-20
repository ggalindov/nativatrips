package com.nativatrips.backend.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** HU-18 criterio 5: cada uso de un enlace magico queda registrado (append-only). */
@Entity
@Table(name = "accesos_enlace_reserva")
public class AccesoEnlaceReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "enlace_id", nullable = false)
    private UUID enlaceId;

    @Column(nullable = false)
    private String accion;

    private String ip;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AccesoEnlaceReserva() {
        // requerido por JPA
    }

    public AccesoEnlaceReserva(UUID enlaceId, String accion, String ip, Instant momento) {
        this.enlaceId = enlaceId;
        this.accion = accion;
        this.ip = ip;
        this.createdAt = momento;
    }

    public UUID getEnlaceId() {
        return enlaceId;
    }

    public String getAccion() {
        return accion;
    }

    public String getIp() {
        return ip;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
