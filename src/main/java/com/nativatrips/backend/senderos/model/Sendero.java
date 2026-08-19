package com.nativatrips.backend.senderos.model;

import com.nativatrips.backend.common.model.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "senderos")
public class Sendero extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_dificultad", nullable = false)
    private NivelDificultad nivelDificultad;

    @Column(name = "duracion_minutos", nullable = false)
    private int duracionMinutos;

    @Column(name = "tipo_experiencia", nullable = false)
    private String tipoExperiencia;

    @Column(name = "requisitos_ingreso")
    private String requisitosIngreso;

    @Column(nullable = false)
    private BigDecimal precio;

    @Column(nullable = false)
    private boolean activo = true;

    protected Sendero() {
        // requerido por JPA
    }

    public Sendero(
            String nombre,
            String descripcion,
            NivelDificultad nivelDificultad,
            int duracionMinutos,
            String tipoExperiencia,
            String requisitosIngreso,
            BigDecimal precio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.nivelDificultad = nivelDificultad;
        this.duracionMinutos = duracionMinutos;
        this.tipoExperiencia = tipoExperiencia;
        this.requisitosIngreso = requisitosIngreso;
        this.precio = precio;
        this.activo = true;
    }

    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public NivelDificultad getNivelDificultad() {
        return nivelDificultad;
    }

    public void setNivelDificultad(NivelDificultad nivelDificultad) {
        this.nivelDificultad = nivelDificultad;
    }

    public int getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(int duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }

    public String getTipoExperiencia() {
        return tipoExperiencia;
    }

    public void setTipoExperiencia(String tipoExperiencia) {
        this.tipoExperiencia = tipoExperiencia;
    }

    public String getRequisitosIngreso() {
        return requisitosIngreso;
    }

    public void setRequisitosIngreso(String requisitosIngreso) {
        this.requisitosIngreso = requisitosIngreso;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
