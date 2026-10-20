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

/** Enlace magico de una reserva (ADR-004). El token solo viaja en el correo; aqui queda su hash. */
@Entity
@Table(name = "enlaces_reserva")
public class EnlaceReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropositoEnlace proposito;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    @Column(name = "revocado_en")
    private Instant revocadoEn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected EnlaceReserva() {
        // requerido por JPA
    }

    public EnlaceReserva(UUID reservaId, String tokenHash, PropositoEnlace proposito, Instant expiraEn, Instant creadoEn) {
        this.reservaId = reservaId;
        this.tokenHash = tokenHash;
        this.proposito = proposito;
        this.expiraEn = expiraEn;
        this.createdAt = creadoEn;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public PropositoEnlace getProposito() {
        return proposito;
    }

    public Instant getExpiraEn() {
        return expiraEn;
    }

    public Instant getRevocadoEn() {
        return revocadoEn;
    }

    public boolean estaVigente(Instant ahora) {
        return revocadoEn == null && ahora.isBefore(expiraEn);
    }

    public void revocar(Instant ahora) {
        if (revocadoEn == null) {
            revocadoEn = ahora;
        }
    }
}
