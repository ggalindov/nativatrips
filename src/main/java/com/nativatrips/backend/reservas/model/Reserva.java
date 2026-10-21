package com.nativatrips.backend.reservas.model;

import com.nativatrips.backend.common.model.Auditable;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "reservas")
public class Reserva extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "codigo_reserva")
    private String codigoReserva;

    @Column(name = "sendero_id", nullable = false)
    private Long senderoId;

    @Embedded
    private TitularReserva titular;

    @Column(name = "guia_id")
    private UUID guiaId;

    @Column(name = "fecha_tour", nullable = false)
    private LocalDate fechaTour;

    @Column(name = "cantidad_personas", nullable = false)
    private int cantidadPersonas;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_grupo", nullable = false)
    private TipoGrupo tipoGrupo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReserva estado;

    @Column(name = "bloqueo_expira_en")
    private Instant bloqueoExpiraEn;

    @Column(name = "asistencia_registrada_en")
    private Instant asistenciaRegistradaEn;

    /** RF-10: cuando salio el aviso previo al tour; null mientras no se envie. */
    @Column(name = "aviso_previo_enviado_en")
    private Instant avisoPrevioEnviadoEn;

    /** RF-11: lo que el guia debe saber del grupo (movilidad, salud, alimentacion). */
    @Column(name = "requerimientos_especiales")
    private String requerimientosEspeciales;

    protected Reserva() {
        // requerido por JPA
    }

    private Reserva(
            Long senderoId,
            LocalDate fechaTour,
            int cantidadPersonas,
            TipoGrupo tipoGrupo,
            Instant bloqueoExpiraEn) {
        this.senderoId = senderoId;
        this.fechaTour = fechaTour;
        this.cantidadPersonas = cantidadPersonas;
        this.tipoGrupo = tipoGrupo;
        this.estado = EstadoReserva.PENDIENTE_PAGO;
        this.bloqueoExpiraEn = bloqueoExpiraEn;
    }

    /**
     * HU-02: reserva sin cuenta, identificada por su codigo y por el correo del titular. Los grupos
     * corporativos y con necesidades especiales nacen en revision y sin conteo de pago (RF-09).
     */
    public static Reserva sinCuenta(
            Long senderoId,
            LocalDate fechaTour,
            int cantidadPersonas,
            TipoGrupo tipoGrupo,
            String requerimientosEspeciales,
            Instant bloqueoExpiraEn,
            String codigoReserva,
            TitularReserva titular) {
        Reserva reserva = new Reserva(
                senderoId, fechaTour, cantidadPersonas, tipoGrupo, tipoGrupo.requiereRevision() ? null : bloqueoExpiraEn);
        if (tipoGrupo.requiereRevision()) {
            reserva.estado = EstadoReserva.EN_REVISION;
        }
        reserva.requerimientosEspeciales = requerimientosEspeciales;
        reserva.codigoReserva = codigoReserva;
        reserva.titular = titular;
        return reserva;
    }

    public UUID getId() {
        return id;
    }

    public String getCodigoReserva() {
        return codigoReserva;
    }

    public void setCodigoReserva(String codigoReserva) {
        this.codigoReserva = codigoReserva;
    }

    public Long getSenderoId() {
        return senderoId;
    }

    public TitularReserva getTitular() {
        return titular;
    }

    public UUID getGuiaId() {
        return guiaId;
    }

    public void setGuiaId(UUID guiaId) {
        this.guiaId = guiaId;
    }

    public LocalDate getFechaTour() {
        return fechaTour;
    }

    public int getCantidadPersonas() {
        return cantidadPersonas;
    }

    public TipoGrupo getTipoGrupo() {
        return tipoGrupo;
    }

    public EstadoReserva getEstado() {
        return estado;
    }

    /** Solo debe invocarse desde ReservaService.transicionarEstado(), nunca directamente. */
    public void setEstado(EstadoReserva estado) {
        this.estado = estado;
    }

    public Instant getBloqueoExpiraEn() {
        return bloqueoExpiraEn;
    }

    public void setBloqueoExpiraEn(Instant bloqueoExpiraEn) {
        this.bloqueoExpiraEn = bloqueoExpiraEn;
    }

    public Instant getAvisoPrevioEnviadoEn() {
        return avisoPrevioEnviadoEn;
    }

    public void marcarAvisoPrevioEnviado(Instant cuando) {
        this.avisoPrevioEnviadoEn = cuando;
    }

    public String getRequerimientosEspeciales() {
        return requerimientosEspeciales;
    }

    public Instant getAsistenciaRegistradaEn() {
        return asistenciaRegistradaEn;
    }

    public void setAsistenciaRegistradaEn(Instant asistenciaRegistradaEn) {
        this.asistenciaRegistradaEn = asistenciaRegistradaEn;
    }
}
