package com.nativatrips.backend.pagos.model;

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
import java.util.UUID;

@Entity
@Table(name = "pagos")
public class Pago extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reserva_id", nullable = false)
    private UUID reservaId;

    @Column(name = "referencia_payu", nullable = false, unique = true)
    private String referenciaPayu;

    @Column(name = "transaction_id_payu")
    private String transactionIdPayu;

    @Column(nullable = false)
    private BigDecimal monto;

    @Column(nullable = false)
    private String moneda;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estado;

    @Column(name = "respuesta_confirmacion")
    private String respuestaConfirmacion;

    protected Pago() {
        // requerido por JPA
    }

    public Pago(UUID reservaId, String referenciaPayu, BigDecimal monto, String moneda) {
        this.reservaId = reservaId;
        this.referenciaPayu = referenciaPayu;
        this.monto = monto;
        this.moneda = moneda;
        this.estado = EstadoPago.PENDIENTE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getReservaId() {
        return reservaId;
    }

    public String getReferenciaPayu() {
        return referenciaPayu;
    }

    public String getTransactionIdPayu() {
        return transactionIdPayu;
    }

    public void setTransactionIdPayu(String transactionIdPayu) {
        this.transactionIdPayu = transactionIdPayu;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public String getMoneda() {
        return moneda;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public String getRespuestaConfirmacion() {
        return respuestaConfirmacion;
    }

    public void setRespuestaConfirmacion(String respuestaConfirmacion) {
        this.respuestaConfirmacion = respuestaConfirmacion;
    }
}
