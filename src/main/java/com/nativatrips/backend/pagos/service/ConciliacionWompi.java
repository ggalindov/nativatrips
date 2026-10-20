package com.nativatrips.backend.pagos.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.pasarela.ClienteWompi;
import com.nativatrips.backend.pagos.pasarela.ResultadoPago;
import com.nativatrips.backend.pagos.pasarela.VerificadorEventosWompi;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.service.ConciliacionPago;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;

/**
 * HU-03 criterio 5: antes de liberar el cupo de una reserva vencida, pregunta a Wompi por sus pagos
 * pendientes. Lo que Wompi responda se aplica igual que un evento (con la misma idempotencia).
 */
@Component
class ConciliacionWompi implements ConciliacionPago {

    private static final Logger log = LoggerFactory.getLogger(ConciliacionWompi.class);

    private final PagoRepository pagoRepository;
    private final PagoService pagoService;
    private final ClienteWompi clienteWompi;

    ConciliacionWompi(PagoRepository pagoRepository, PagoService pagoService, ClienteWompi clienteWompi) {
        this.pagoRepository = pagoRepository;
        this.pagoService = pagoService;
        this.clienteWompi = clienteWompi;
    }

    @Override
    public Resultado conciliar(UUID reservaId) {
        List<Pago> pendientes = pagoRepository.findByReservaIdOrderByCreatedAtDesc(reservaId).stream()
                .filter(p -> p.getEstado() == EstadoPago.PENDIENTE)
                .toList();
        if (pendientes.isEmpty()) {
            return Resultado.SIN_PAGO;
        }
        if (!clienteWompi.puedeConsultar()) {
            log.warn("Sin WOMPI_LLAVE_PRIVADA no se puede conciliar la reserva {}; se libera el cupo", reservaId);
            return Resultado.SIN_PAGO;
        }

        boolean enProceso = false;
        for (Pago pago : pendientes) {
            List<ClienteWompi.Transaccion> transacciones;
            try {
                transacciones = clienteWompi.transaccionesPorReferencia(pago.getReferencia());
            } catch (RestClientException ex) {
                log.warn("Wompi no respondio la consulta de la referencia {}", pago.getReferencia(), ex);
                return Resultado.SIN_RESPUESTA;
            }
            for (ClienteWompi.Transaccion t : transacciones) {
                EstadoPago estado = VerificadorEventosWompi.mapearEstado(t.estado());
                if (estado == EstadoPago.PENDIENTE) {
                    enProceso = true;
                    continue;
                }
                try {
                    pagoService.aplicarResultado(new ResultadoPago(
                            t.referencia(), t.id(), estado, t.monto(), t.moneda(),
                            "Conciliacion con la API de Wompi (status=" + t.estado() + ")", t.cruda()));
                } catch (BusinessRuleException ex) {
                    log.error("La transaccion {} de Wompi no corresponde al pago {}: {}", t.id(), pago.getId(), ex.getMessage());
                    continue;
                }
                if (estado == EstadoPago.APROBADO) {
                    return Resultado.PAGADA;
                }
            }
        }
        return enProceso ? Resultado.SIN_RESPUESTA : Resultado.SIN_PAGO;
    }
}
