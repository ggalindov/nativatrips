package com.nativatrips.backend.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "reserva_integrantes")
public class ReservaIntegrante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Column(name = "nombre_completo", nullable = false)
    private String nombreCompleto;

    @Column(name = "documento_identidad", nullable = false)
    private String documentoIdentidad;

    protected ReservaIntegrante() {
        // requerido por JPA
    }

    public ReservaIntegrante(UUID reservaId, String nombreCompleto, String documentoIdentidad) {
        this.reservaId = reservaId;
        this.nombreCompleto = nombreCompleto;
        this.documentoIdentidad = documentoIdentidad;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public String getDocumentoIdentidad() {
        return documentoIdentidad;
    }
}
