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

@Entity
@Table(name = "limites_capacidad")
public class LimiteCapacidad extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sendero_id", nullable = false)
    private Long senderoId;

    @Column(name = "temporada_inicio", nullable = false)
    private LocalDate temporadaInicio;

    @Column(name = "temporada_fin", nullable = false)
    private LocalDate temporadaFin;

    @Column(name = "cupo_maximo_dia", nullable = false)
    private int cupoMaximoDia;

    @Column(name = "umbral_alerta_pct", nullable = false)
    private short umbralAlertaPct = 80;

    @Column(name = "configurado_por_usuario_id")
    private UUID configuradoPorUsuarioId;

    @Column(name = "configurado_por_externo")
    private String configuradoPorExterno;

    protected LimiteCapacidad() {
        // requerido por JPA
    }

    public LimiteCapacidad(
            Long senderoId,
            LocalDate temporadaInicio,
            LocalDate temporadaFin,
            int cupoMaximoDia,
            short umbralAlertaPct,
            UUID configuradoPorUsuarioId,
            String configuradoPorExterno) {
        this.senderoId = senderoId;
        this.temporadaInicio = temporadaInicio;
        this.temporadaFin = temporadaFin;
        this.cupoMaximoDia = cupoMaximoDia;
        this.umbralAlertaPct = umbralAlertaPct;
        this.configuradoPorUsuarioId = configuradoPorUsuarioId;
        this.configuradoPorExterno = configuradoPorExterno;
    }

    /** true si la fecha cae dentro de la temporada [temporadaInicio, temporadaFin]. */
    public boolean cubre(LocalDate fecha) {
        return !fecha.isBefore(temporadaInicio) && !fecha.isAfter(temporadaFin);
    }

    /** true si este rango de temporada se solapa con [otroInicio, otroFin]. */
    public boolean seSolapaCon(LocalDate otroInicio, LocalDate otroFin) {
        return !temporadaInicio.isAfter(otroFin) && !otroInicio.isAfter(temporadaFin);
    }

    public Long getId() {
        return id;
    }

    public Long getSenderoId() {
        return senderoId;
    }

    public LocalDate getTemporadaInicio() {
        return temporadaInicio;
    }

    public LocalDate getTemporadaFin() {
        return temporadaFin;
    }

    public void setTemporada(LocalDate temporadaInicio, LocalDate temporadaFin) {
        this.temporadaInicio = temporadaInicio;
        this.temporadaFin = temporadaFin;
    }

    public int getCupoMaximoDia() {
        return cupoMaximoDia;
    }

    public void setCupoMaximoDia(int cupoMaximoDia) {
        this.cupoMaximoDia = cupoMaximoDia;
    }

    public short getUmbralAlertaPct() {
        return umbralAlertaPct;
    }

    public void setUmbralAlertaPct(short umbralAlertaPct) {
        this.umbralAlertaPct = umbralAlertaPct;
    }

    public UUID getConfiguradoPorUsuarioId() {
        return configuradoPorUsuarioId;
    }

    public String getConfiguradoPorExterno() {
        return configuradoPorExterno;
    }
}
