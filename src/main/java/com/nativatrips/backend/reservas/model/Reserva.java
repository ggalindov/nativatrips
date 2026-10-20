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

    /** Solo en reservas hechas con la cuenta TURISTA anterior; las nuevas llevan titular (ADR-004). */
    @Column(name = "turista_id")
    private UUID turistaId;

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

    protected Reserva() {
        // requerido por JPA
    }

    public Reserva(
            Long senderoId,
            UUID turistaId,
            LocalDate fechaTour,
            int cantidadPersonas,
            TipoGrupo tipoGrupo,
            Instant bloqueoExpiraEn) {
        this.senderoId = senderoId;
        this.turistaId = turistaId;
        this.fechaTour = fechaTour;
        this.cantidadPersonas = cantidadPersonas;
        this.tipoGrupo = tipoGrupo;
        this.estado = EstadoReserva.PENDIENTE_PAGO;
        this.bloqueoExpiraEn = bloqueoExpiraEn;
    }

    /** HU-02: reserva sin cuenta, identificada por su codigo y por el correo del titular. */
    public static Reserva sinCuenta(
            Long senderoId,
            LocalDate fechaTour,
            int cantidadPersonas,
            Instant bloqueoExpiraEn,
            String codigoReserva,
            TitularReserva titular) {
        Reserva reserva = new Reserva(senderoId, null, fechaTour, cantidadPersonas, TipoGrupo.ESTANDAR, bloqueoExpiraEn);
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

    public UUID getTuristaId() {
        return turistaId;
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

    public Instant getAsistenciaRegistradaEn() {
        return asistenciaRegistradaEn;
    }

    public void setAsistenciaRegistradaEn(Instant asistenciaRegistradaEn) {
        this.asistenciaRegistradaEn = asistenciaRegistradaEn;
    }
}
