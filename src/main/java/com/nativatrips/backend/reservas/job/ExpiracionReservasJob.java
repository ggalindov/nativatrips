package com.nativatrips.backend.reservas.job;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.ReservaService;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * RF-05: libera el cupo de las reservas PENDIENTE_PAGO cuyo bloqueo temporal vencio sin que el
 * turista completara el pago. Corre periodicamente; cada transicion queda registrada en
 * reserva_estado_historial via ReservaService.transicionarEstado().
 */
@Component
public class ExpiracionReservasJob {

    private static final Logger log = LoggerFactory.getLogger(ExpiracionReservasJob.class);

    private final ReservaRepository reservaRepository;
    private final ReservaService reservaService;

    public ExpiracionReservasJob(ReservaRepository reservaRepository, ReservaService reservaService) {
        this.reservaRepository = reservaRepository;
        this.reservaService = reservaService;
    }

    @Scheduled(fixedDelayString = "${app.reservas.expiracion-fixed-delay-ms:60000}")
    public void expirarReservasVencidas() {
        List<Reserva> vencidas =
                reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(EstadoReserva.PENDIENTE_PAGO, Instant.now());

        for (Reserva reserva : vencidas) {
            try {
                reservaService.transicionarEstado(
                        reserva.getId(),
                        EstadoReserva.EXPIRADA,
                        "Bloqueo temporal vencido sin completar el pago",
                        OrigenCambioEstado.SISTEMA,
                        null);
            } catch (Exception ex) {
                log.error("No se pudo expirar la reserva {}", reserva.getId(), ex);
            }
        }

        if (!vencidas.isEmpty()) {
            log.info("Expiradas {} reservas por vencimiento de bloqueo temporal", vencidas.size());
        }
    }
}
