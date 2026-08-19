package com.nativatrips.backend.usuarios.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    @Column(nullable = false)
    private boolean usado = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PasswordResetToken() {
        // requerido por JPA
    }

    public PasswordResetToken(UUID usuarioId, String token, Instant expiraEn) {
        this.usuarioId = usuarioId;
        this.token = token;
        this.expiraEn = expiraEn;
        this.usado = false;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getUsuarioId() {
        return usuarioId;
    }

    public String getToken() {
        return token;
    }

    public Instant getExpiraEn() {
        return expiraEn;
    }

    public boolean isUsado() {
        return usado;
    }

    public void marcarUsado() {
        this.usado = true;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean estaVigente(Instant ahora) {
        return !usado && ahora.isBefore(expiraEn);
    }
}
