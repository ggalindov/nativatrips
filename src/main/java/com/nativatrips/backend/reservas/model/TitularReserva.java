package com.nativatrips.backend.reservas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/** Quien reserva sin cuenta (ADR-004): a este correo llegan el codigo y, desde el Sprint 2, el enlace. */
@Embeddable
public class TitularReserva {

    @Column(name = "titular_nombre")
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "titular_tipo_documento")
    private TipoDocumento tipoDocumento;

    @Column(name = "titular_documento")
    private String documento;

    @Column(name = "titular_nacionalidad")
    private String nacionalidad;

    @Column(name = "titular_correo")
    private String correo;

    @Column(name = "titular_indicativo")
    private String indicativo;

    @Column(name = "titular_celular")
    private String celular;

    protected TitularReserva() {
        // requerido por JPA
    }

    public TitularReserva(
            String nombre,
            TipoDocumento tipoDocumento,
            String documento,
            String nacionalidad,
            String correo,
            String indicativo,
            String celular) {
        this.nombre = nombre;
        this.tipoDocumento = tipoDocumento;
        this.documento = documento;
        this.nacionalidad = nacionalidad;
        this.correo = correo;
        this.indicativo = indicativo;
        this.celular = celular;
    }

    public String getNombre() {
        return nombre;
    }

    public TipoDocumento getTipoDocumento() {
        return tipoDocumento;
    }

    public String getDocumento() {
        return documento;
    }

    public String getNacionalidad() {
        return nacionalidad;
    }

    public String getCorreo() {
        return correo;
    }

    public String getIndicativo() {
        return indicativo;
    }

    public String getCelular() {
        return celular;
    }
}
