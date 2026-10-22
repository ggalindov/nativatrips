package com.nativatrips.backend.senderos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** RF-35: foto de un sendero guardada en el almacen de archivos. */
@Entity
@Table(name = "sendero_fotos")
public class FotoSendero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "sendero_id", nullable = false)
    private Long senderoId;

    @Column(nullable = false)
    private String ruta;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private int orden;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FotoSendero() {
        // requerido por JPA
    }

    public FotoSendero(Long senderoId, String ruta, String tipo, int orden, Instant creadaEn) {
        this.senderoId = senderoId;
        this.ruta = ruta;
        this.tipo = tipo;
        this.orden = orden;
        this.createdAt = creadaEn;
    }

    public UUID getId() {
        return id;
    }

    public Long getSenderoId() {
        return senderoId;
    }

    public String getRuta() {
        return ruta;
    }

    public String getTipo() {
        return tipo;
    }

    public int getOrden() {
        return orden;
    }
}
