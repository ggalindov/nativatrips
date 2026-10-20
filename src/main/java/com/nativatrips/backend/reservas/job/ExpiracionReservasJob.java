package com.nativatrips.backend.reservas.job;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.ConciliacionPago;
import com.nativatrips.backend.reservas.service.ReservaService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * RF-05: libera el cupo de las reservas PENDIENTE_PAGO cuyo bloqueo temporal vencio sin que el
 * turista completara el pago. Antes de liberar consulta a la pasarela por si el evento del pago se
 * perdio (HU-03 criterio 5). Corre periodicamente; cada transicion queda registrada en
 * reserva_estado_historial via ReservaService.transicionarEstado().
 */
@Component
public class ExpiracionReservasJob {

    /** Si la pasarela no responde, se espera hasta este tiempo despues del vencimiento antes de liberar. */
    static final Duration ESPERA_MAXIMA_CONCILIACION = Duration.ofMinutes(30);

    private static final Logger log = LoggerFactory.getLogger(ExpiracionReservasJob.class);

    private final ReservaRepository reservaRepository;
    private final ReservaService reservaService;
    private final ConciliacionPago conciliacion;

    public ExpiracionReservasJob(
            ReservaRepository reservaRepository, ReservaService reservaService, ConciliacionPago conciliacion) {
        this.reservaRepository = reservaRepository;
        this.reservaService = reservaService;
        this.conciliacion = conciliacion;
    }

    @Scheduled(fixedDelayString = "${app.reservas.expiracion-fixed-delay-ms:60000}")
    public void expirarReservasVencidas() {
        Instant ahora = Instant.now();
        List<Reserva> vencidas =
                reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(EstadoReserva.PENDIENTE_PAGO, ahora);

        int expiradas = 0;
        for (Reserva reserva : vencidas) {
            try {
                if (debeExpirar(reserva, ahora)) {
                    reservaService.transicionarEstado(
                            reserva.getId(),
                            EstadoReserva.EXPIRADA,
                            "Bloqueo temporal vencido sin completar el pago",
                            OrigenCambioEstado.SISTEMA,
                            null);
                    expiradas++;
                }
            } catch (Exception ex) {
                log.error("No se pudo expirar la reserva {}", reserva.getId(), ex);
            }
        }

        if (expiradas > 0) {
            log.info("Expiradas {} reservas por vencimiento de bloqueo temporal", expiradas);
        }
    }

    private boolean debeExpirar(Reserva reserva, Instant ahora) {
        return switch (conciliacion.conciliar(reserva.getId())) {
            case PAGADA -> false;
            // La conciliacion pudo aplicar un tercer rechazo y cancelarla: solo se expira si sigue pendiente.
            case SIN_PAGO -> sigueSinPagar(reserva);
            case SIN_RESPUESTA -> {
                boolean esperoDemasiado = reserva.getBloqueoExpiraEn().plus(ESPERA_MAXIMA_CONCILIACION).isBefore(ahora);
                if (!esperoDemasiado) {
                    log.warn("Sin respuesta de la pasarela para la reserva {}; se reintenta en el siguiente ciclo",
                            reserva.getId());
                }
                yield esperoDemasiado && sigueSinPagar(reserva);
            }
        };
    }

    private boolean sigueSinPagar(Reserva reserva) {
        return reservaRepository.findById(reserva.getId())
                .map(r -> r.getEstado() == EstadoReserva.PENDIENTE_PAGO)
                .orElse(false);
    }
}
