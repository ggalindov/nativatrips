package com.nativatrips.backend.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** RF-36: enlace al historial de reservas de un correo. El token solo viaja en el correo; aqui queda su hash. */
@Entity
@Table(name = "enlaces_historial")
public class EnlaceHistorial {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String correo;

    @Column(name = "token_hash", nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected EnlaceHistorial() {
        // requerido por JPA
    }

    public EnlaceHistorial(String correo, String tokenHash, Instant expiraEn, Instant creadoEn) {
        this.correo = correo;
        this.tokenHash = tokenHash;
        this.expiraEn = expiraEn;
        this.createdAt = creadoEn;
    }

    public String getCorreo() {
        return correo;
    }

    public boolean estaVigente(Instant ahora) {
        return ahora.isBefore(expiraEn);
    }
}
