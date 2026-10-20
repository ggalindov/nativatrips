package com.nativatrips.backend.senderos.model;

import com.nativatrips.backend.common.model.Auditable;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    @Embedded
    private FichaTecnica ficha = FichaTecnica.sinDatos();

    /** Puntos destacados del recorrido, en el orden en que se muestran. */
    @ElementCollection
    @CollectionTable(name = "sendero_destacados", joinColumns = @JoinColumn(name = "sendero_id"))
    @OrderColumn(name = "orden")
    @Column(name = "texto", nullable = false)
    private List<String> destacados = new ArrayList<>();

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

    public FichaTecnica getFicha() {
        return ficha;
    }

    public void setFicha(FichaTecnica ficha) {
        this.ficha = ficha != null ? ficha : FichaTecnica.sinDatos();
    }

    public List<String> getDestacados() {
        return List.copyOf(destacados);
    }

    public void reemplazarDestacados(List<String> nuevos) {
        destacados.clear();
        if (nuevos != null) {
            destacados.addAll(nuevos);
        }
    }
}
