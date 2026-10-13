package com.nativatrips.backend.pagos.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.config.PayuProperties;
import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.dto.IniciarPagoResponse;
import com.nativatrips.backend.pagos.dto.PagoResponse;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.model.PagoEstadoHistorial;
import com.nativatrips.backend.pagos.repository.PagoEstadoHistorialRepository;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.math.BigDecimal;
import java.time.Instant;
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
 * mueva la reserva a CONFIRMADA o CANCELADA con la trazabilidad de RNF-13 intacta.
 */
@Service
public class PagoService {

    private static final Logger log = LoggerFactory.getLogger(PagoService.class);

    private final PagoRepository pagoRepository;
    private final PagoEstadoHistorialRepository historialRepository;
    private final ReservaRepository reservaRepository;
    private final SenderoRepository senderoRepository;
    private final ReservaService reservaService;
    private final PayuSignatureService signatureService;
    private final PayuProperties payuProperties;

    public PagoService(
            PagoRepository pagoRepository,
            PagoEstadoHistorialRepository historialRepository,
            ReservaRepository reservaRepository,
            SenderoRepository senderoRepository,
            ReservaService reservaService,
            PayuSignatureService signatureService,
            PayuProperties payuProperties) {
        this.pagoRepository = pagoRepository;
        this.historialRepository = historialRepository;
        this.reservaRepository = reservaRepository;
        this.senderoRepository = senderoRepository;
        this.reservaService = reservaService;
        this.signatureService = signatureService;
        this.payuProperties = payuProperties;
    }

    /** RF-06: arma los campos del formulario WebCheckout que el frontend redirige hacia PayU. */
    @Transactional
    public IniciarPagoResponse iniciarPago(UUID reservaId, UUID turistaId, String buyerEmail) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .filter(r -> r.getTuristaId().equals(turistaId))
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        if (reserva.getEstado() != EstadoReserva.PENDIENTE_PAGO) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva no esta pendiente de pago (estado actual: " + reserva.getEstado() + ")");
        }
        if (reserva.getBloqueoExpiraEn() == null || reserva.getBloqueoExpiraEn().isBefore(Instant.now())) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "El bloqueo temporal de la reserva vencio, vuelve a crear la reserva");
        }

        Pago pago = pagoRepository
                .findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(reservaId, EstadoPago.PENDIENTE)
                .orElseGet(() -> crearPagoPendiente(reserva));

        String firma = signatureService.generarFirmaSolicitud(
                pago.getReferenciaPayu(), pago.getMonto(), payuProperties.getCurrency());

        return new IniciarPagoResponse(
                payuProperties.getCheckoutUrl(),
                payuProperties.getMerchantId(),
                payuProperties.getAccountId(),
                "Reserva NativaTrips " + reserva.getId(),
                pago.getReferenciaPayu(),
                signatureService.formatearMonto(pago.getMonto()),
                "0",
                "0",
                payuProperties.getCurrency(),
                firma,
                payuProperties.isTestMode() ? "1" : "0",
                buyerEmail,
                payuProperties.getResponseUrl(),
                payuProperties.getConfirmationUrl());
    }

    private Pago crearPagoPendiente(Reserva reserva) {
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId())
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));
        BigDecimal monto = sendero.getPrecio().multiply(BigDecimal.valueOf(reserva.getCantidadPersonas()));

        String referencia = "NATIVATRIPS-" + reserva.getId().toString().replace("-", "").substring(0, 12).toUpperCase()
                + "-" + System.currentTimeMillis();
        Pago pago = pagoRepository.save(new Pago(reserva.getId(), referencia, monto, payuProperties.getCurrency()));
        historialRepository.save(new PagoEstadoHistorial(pago.getId(), null, EstadoPago.PENDIENTE, "Pago iniciado"));
        return pago;
    }

    /**
     * RF-07: procesa el webhook de confirmacion de PayU. Valida la firma y el monto antes de
     * confiar en el resultado — sin esto, cualquiera podria POSTear un "pago aprobado" falso.
     */
    @Transactional
    public void procesarConfirmacion(ConfirmacionPayuPayload payload) {
        boolean firmaValida = signatureService.validarFirmaConfirmacion(
                payload.referenceSale(), payload.value(), payload.currency(), payload.statePol(), payload.sign());
        if (!firmaValida) {
            log.warn("Firma invalida en confirmacion de PayU para referencia {}", payload.referenceSale());
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "Firma de confirmacion invalida");
        }

        Pago pago = pagoRepository.findByReferenciaPayu(payload.referenceSale())
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado para la referencia " + payload.referenceSale()));

        BigDecimal valorRecibido = new BigDecimal(payload.value());
        if (valorRecibido.compareTo(pago.getMonto()) != 0) {
            log.error(
                    "Monto de confirmacion ({}) no coincide con el monto esperado ({}) para el pago {}",
                    valorRecibido, pago.getMonto(), pago.getId());
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "El monto confirmado no coincide con el monto del pago");
        }

        EstadoPago nuevoEstado = mapearEstado(payload.statePol());
        EstadoPago anterior = pago.getEstado();
        pago.setEstado(nuevoEstado);
        pago.setTransactionIdPayu(payload.transactionId());
        pago.setRespuestaConfirmacion(payload.rawPayload());

        historialRepository.save(new PagoEstadoHistorial(
                pago.getId(), anterior, nuevoEstado, "Confirmacion PayU recibida (state_pol=" + payload.statePol() + ")"));

        switch (nuevoEstado) {
            case APROBADO -> reservaService.transicionarEstado(
                    pago.getReservaId(), EstadoReserva.CONFIRMADA, "Pago aprobado por PayU",
                    OrigenCambioEstado.PAGO, null);
            case RECHAZADO, EXPIRADO -> reservaService.transicionarEstado(
                    pago.getReservaId(), EstadoReserva.CANCELADA,
                    "Pago " + nuevoEstado.name().toLowerCase() + " por PayU", OrigenCambioEstado.PAGO, null);
            default -> {
                // PENDIENTE (p.ej. PSE en proceso) o ERROR: no se toca el estado de la reserva,
                // se espera la siguiente confirmacion de PayU con el estado final.
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<PagoResponse> obtenerUltimoPago(UUID reservaId, UUID turistaId) {
        boolean esDelTurista = reservaRepository.findById(reservaId)
                .filter(r -> r.getTuristaId().equals(turistaId))
                .isPresent();
        if (!esDelTurista) {
            throw new ResourceNotFoundException("Reserva no encontrada");
        }
        return pagoRepository.findByReservaIdOrderByCreatedAtDesc(reservaId).stream()
                .findFirst()
                .map(PagoResponse::from);
    }

    private EstadoPago mapearEstado(String statePol) {
        return switch (statePol) {
            case "4" -> EstadoPago.APROBADO;
            case "6" -> EstadoPago.RECHAZADO;
            case "5" -> EstadoPago.EXPIRADO;
            case "7" -> EstadoPago.PENDIENTE;
            default -> EstadoPago.ERROR;
        };
    }
}
