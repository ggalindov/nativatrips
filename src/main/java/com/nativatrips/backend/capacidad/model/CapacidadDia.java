package com.nativatrips.backend.capacidad.model;

import com.nativatrips.backend.common.model.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

/** Capacidad de carga de un sendero para un dia concreto (ADR-008). */
@Entity
@Table(name = "capacidad_dia")
public class CapacidadDia extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sendero_id", nullable = false)
    private Long senderoId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "cupo_maximo", nullable = false)
    private int cupoMaximo;

    @Column(name = "umbral_alerta_pct", nullable = false)
    private short umbralAlertaPct;

    @Column(name = "cargado_por_usuario_id", nullable = false)
    private UUID cargadoPorUsuarioId;

    protected CapacidadDia() {
        // requerido por JPA
    }

    public CapacidadDia(Long senderoId, LocalDate fecha, int cupoMaximo, short umbralAlertaPct, UUID cargadoPorUsuarioId) {
        this.senderoId = senderoId;
        this.fecha = fecha;
        this.cupoMaximo = cupoMaximo;
        this.umbralAlertaPct = umbralAlertaPct;
        this.cargadoPorUsuarioId = cargadoPorUsuarioId;
    }

    /** Cambia el cupo y el umbral; quien lo cambia queda como responsable del registro. */
    public void actualizar(int cupoMaximo, short umbralAlertaPct, UUID cargadoPorUsuarioId) {
        this.cupoMaximo = cupoMaximo;
        this.umbralAlertaPct = umbralAlertaPct;
        this.cargadoPorUsuarioId = cargadoPorUsuarioId;
    }

    /** true si la ocupacion llega al umbral de alerta del dia. */
    public boolean umbralSuperadoCon(int ocupacion) {
        return ocupacion * 100.0 / cupoMaximo >= umbralAlertaPct;
    }

    public Long getId() {
        return id;
    }

    public Long getSenderoId() {
        return senderoId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public int getCupoMaximo() {
        return cupoMaximo;
    }

    public short getUmbralAlertaPct() {
        return umbralAlertaPct;
    }

    public UUID getCargadoPorUsuarioId() {
        return cargadoPorUsuarioId;
    }
}
