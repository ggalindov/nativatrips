package com.nativatrips.backend.pagos.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.dto.PagoResponse;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.EventoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.model.PagoEstadoHistorial;
import com.nativatrips.backend.pagos.pasarela.CheckoutPago;
import com.nativatrips.backend.pagos.pasarela.PasarelaPago;
import com.nativatrips.backend.pagos.pasarela.ResultadoPago;
import com.nativatrips.backend.pagos.repository.EventoPagoRepository;
import com.nativatrips.backend.pagos.repository.PagoEstadoHistorialRepository;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.EnlaceReservaService;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * PagoService depende de ReservaService (no al reves): reservas no sabe que existe un modulo
 * de pagos, solo expone transicionarEstado() para que quien procese el resultado del pago
 * mueva la reserva a CONFIRMADA o CANCELADA con la trazabilidad de RNF-13 intacta. Lo propio de
 * cada pasarela queda en su adaptador (ADR-005).
 */
@Service
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);

    /** HU-03 criterio 3 (BUG-03): el primer intento y dos reintentos; al tercer rechazo se cancela. */
    static final int MAXIMO_INTENTOS = 3;

    private static final List<EstadoPago> INTENTOS_FALLIDOS = List.of(EstadoPago.RECHAZADO, EstadoPago.EXPIRADO);

    private final PagoRepository pagoRepository;
    private final PagoEstadoHistorialRepository historialRepository;
    private final EventoPagoRepository eventoRepository;
    private final ReservaRepository reservaRepository;
    private final SenderoRepository senderoRepository;
    private final ReservaService reservaService;
    private final PasarelaPago pasarela;
    private final WompiProperties wompiProperties;
    private final EnlaceReservaService enlaceService;
    private final AvisosDePago avisos;

    public PagoService(
            PagoRepository pagoRepository,
            PagoEstadoHistorialRepository historialRepository,
            EventoPagoRepository eventoRepository,
            ReservaRepository reservaRepository,
            SenderoRepository senderoRepository,
            ReservaService reservaService,
            PasarelaPago pasarela,
            WompiProperties wompiProperties,
            EnlaceReservaService enlaceService,
            AvisosDePago avisos) {
        this.pagoRepository = pagoRepository;
        this.historialRepository = historialRepository;
        this.eventoRepository = eventoRepository;
        this.reservaRepository = reservaRepository;
        this.senderoRepository = senderoRepository;
        this.reservaService = reservaService;
        this.pasarela = pasarela;
        this.wompiProperties = wompiProperties;
        this.enlaceService = enlaceService;
        this.avisos = avisos;
    }

    /** HU-03 y HU-18: el titular paga el total desde el enlace magico de su reserva, sin cuenta. */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public CheckoutPago iniciarPagoConEnlace(String token, String ip) {
        Reserva reserva = enlaceService.abrir(token, "PAGAR", ip);
        return checkout(reserva, reserva.getTitular() == null ? null : reserva.getTitular().getCorreo());
    }

    private CheckoutPago checkout(Reserva reserva, String correoComprador) {
        if (reserva.getEstado() != EstadoReserva.PENDIENTE_PAGO) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva no esta pendiente de pago (estado actual: " + reserva.getEstado() + ")");
        }
        if (reserva.getBloqueoExpiraEn() == null || reserva.getBloqueoExpiraEn().isBefore(Instant.now())) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "El bloqueo temporal de la reserva vencio, vuelve a crear la reserva");
        }

        Pago pago = pagoRepository
                .findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(reserva.getId(), EstadoPago.PENDIENTE)
                .orElseGet(() -> crearPagoPendiente(reserva));

        return pasarela.prepararCheckout(pago, reserva.getBloqueoExpiraEn(), correoComprador);
    }

    private Pago crearPagoPendiente(Reserva reserva) {
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId())
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));
        BigDecimal monto = sendero.getPrecio().multiply(BigDecimal.valueOf(reserva.getCantidadPersonas()));

        // Una referencia por intento: Wompi no acepta repetir la de una transaccion ya procesada.
        String prefijo = reserva.getCodigoReserva() != null
                ? reserva.getCodigoReserva()
                : "NT-" + reserva.getId().toString().replace("-", "").substring(0, 12).toUpperCase();
        String referencia = prefijo + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Pago pago = pagoRepository.save(new Pago(reserva.getId(), referencia, monto, wompiProperties.getMoneda()));
        historialRepository.save(new PagoEstadoHistorial(pago.getId(), null, EstadoPago.PENDIENTE, "Pago iniciado"));
        return pago;
    }

    /**
     * RF-07: aplica un resultado cuya firma ya verifico el adaptador. El monto y la moneda deben
     * ser los del pago; si no, alguien altero el cobro y no se toca nada. Un evento repetido o uno
     * que llega despues de la aprobacion no cambia nada (ADR-005 punto 4).
     */
    @Transactional
    public void aplicarResultado(ResultadoPago resultado) {
        Pago pago = pagoRepository.findByReferenciaConBloqueo(resultado.referencia())
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado para la referencia " + resultado.referencia()));

        if (resultado.monto().compareTo(pago.getMonto()) != 0 || !pago.getMoneda().equals(resultado.moneda())) {
            log.error(
                    "Monto de confirmacion ({} {}) no coincide con el esperado ({} {}) para el pago {}",
                    resultado.monto(), resultado.moneda(), pago.getMonto(), pago.getMoneda(), pago.getId());
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "El monto confirmado no coincide con el monto del pago");
        }

        if (resultado.transaccionId() == null || resultado.transaccionId().isBlank()) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "El evento no trae el identificador de la transaccion");
        }
        if (eventoRepository.existsByTransaccionIdAndEstado(resultado.transaccionId(), resultado.estado())) {
            log.info("Evento repetido de la transaccion {} ({}); no se vuelve a aplicar",
                    resultado.transaccionId(), resultado.estado());
            return;
        }
        eventoRepository.save(new EventoPago(pago.getId(), resultado.transaccionId(), resultado.estado(), Instant.now()));
        if (pago.getEstado() == EstadoPago.APROBADO) {
            log.warn("Evento {} para el pago {} ya aprobado; se registra y no se reabre", resultado.estado(), pago.getId());
            return;
        }

        EstadoPago nuevoEstado = resultado.estado();
        EstadoPago anterior = pago.getEstado();
        pago.setEstado(nuevoEstado);
        pago.setTransaccionId(resultado.transaccionId());
        pago.setRespuestaConfirmacion(resultado.respuestaCruda());

        historialRepository.save(new PagoEstadoHistorial(pago.getId(), anterior, nuevoEstado, resultado.detalle()));

        switch (nuevoEstado) {
            case APROBADO -> {
                Reserva confirmada = reservaService.transicionarEstado(
                        pago.getReservaId(), EstadoReserva.CONFIRMADA, "Pago aprobado por la pasarela",
                        OrigenCambioEstado.PAGO, null);
                avisos.comprobante(confirmada, pago, Instant.now());
            }
            case RECHAZADO, EXPIRADO -> registrarIntentoFallido(pago, nuevoEstado);
            default -> {
                // PENDIENTE (p.ej. PSE en proceso) o ERROR: no se toca el estado de la reserva,
                // se espera el siguiente evento con el estado final.
            }
        }
    }

    /**
     * BUG-03: un rechazo deja la reserva en PENDIENTE_PAGO para reintentar mientras dure el apartado;
     * solo el tercer intento fallido la cancela y libera el cupo.
     */
    private void registrarIntentoFallido(Pago pago, EstadoPago estado) {
        long fallidos = pagoRepository.countByReservaIdAndEstadoIn(pago.getReservaId(), INTENTOS_FALLIDOS);
        if (fallidos >= MAXIMO_INTENTOS) {
            Reserva cancelada = reservaService.transicionarEstado(
                    pago.getReservaId(), EstadoReserva.CANCELADA,
                    "Pago " + estado.name().toLowerCase() + " por la pasarela en el intento " + fallidos + " de "
                            + MAXIMO_INTENTOS + "; se libera el cupo",
                    OrigenCambioEstado.PAGO, null);
            avisos.rechazo(cancelada, pago, 0);
        } else {
            log.info("Intento de pago {} de {} fallido para la reserva {}; puede reintentar",
                    fallidos, MAXIMO_INTENTOS, pago.getReservaId());
            reservaRepository.findById(pago.getReservaId())
                    .ifPresent(reserva -> avisos.rechazo(reserva, pago, MAXIMO_INTENTOS - fallidos));
        }
    }

    /** El titular consulta el estado de su ultimo pago desde el enlace (p. ej. al volver de Wompi). */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public Optional<PagoResponse> ultimoPagoConEnlace(String token, String ip) {
        Reserva reserva = enlaceService.abrir(token, "CONSULTAR_PAGO", ip);
        return pagoRepository.findByReservaIdOrderByCreatedAtDesc(reserva.getId()).stream()
                .findFirst()
                .map(PagoResponse::from);
    }
}
