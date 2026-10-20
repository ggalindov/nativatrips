package com.nativatrips.backend.usuarios.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Token cerrado antes de vencer; se conserva hasta su vencimiento (BUG-02). */
@Entity
@Table(name = "tokens_revocados")
public class TokenRevocado {

    @Id
    private UUID jti;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    @Column(name = "revocado_en", nullable = false)
    private Instant revocadoEn;

    protected TokenRevocado() {
        // requerido por JPA
    }

    public TokenRevocado(UUID jti, Instant expiraEn, Instant revocadoEn) {
        this.jti = jti;
        this.expiraEn = expiraEn;
        this.revocadoEn = revocadoEn;
    }

    public UUID getJti() {
        return jti;
    }

    public Instant getExpiraEn() {
        return expiraEn;
    }

    public Instant getRevocadoEn() {
        return revocadoEn;
    }
}
