package com.nativatrips.backend.capacidad.service;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaRequest;
import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.CargaCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de capacidad de carga (RF-23 a RF-26, ADR-008). No conoce reservas: la ocupacion le
 * llega por parametro o por el puerto {@link OcupacionDelDia}, que implementa el modulo de
 * reservas; asi la dependencia va en un solo sentido (reservas -> capacidad).
 */
@Service
public class CapacidadService {

    static final short UMBRAL_ALERTA_POR_DEFECTO = 80;

    private final CapacidadDiaRepository capacidadDiaRepository;
    private final SenderoRepository senderoRepository;
    private final OcupacionDelDia ocupacionDelDia;
    private final Clock reloj;

    public CapacidadService(
            CapacidadDiaRepository capacidadDiaRepository,
            SenderoRepository senderoRepository,
            OcupacionDelDia ocupacionDelDia,
            Clock reloj) {
        this.capacidadDiaRepository = capacidadDiaRepository;
        this.senderoRepository = senderoRepository;
        this.ocupacionDelDia = ocupacionDelDia;
        this.reloj = reloj;
    }

    /** Capacidad cargada de todos los senderos entre dos fechas, con la ocupacion de cada dia. */
    @Transactional(readOnly = true)
    public List<CapacidadDiaResponse> consultarDias(LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "La fecha final no puede ser anterior a la inicial");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) >= CargaCapacidadRequest.MAX_DIAS) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "Se pueden consultar como maximo " + CargaCapacidadRequest.MAX_DIAS + " dias");
        }
        return capacidadDiaRepository.findByFechaBetweenOrderByFechaAscSenderoIdAsc(desde, hasta).stream()
                .map(dia -> CapacidadDiaResponse.from(
                        dia, ocupacionDelDia.personasReservadas(dia.getSenderoId(), dia.getFecha())))
                .toList();
    }

    /**
     * Carga o corrige la capacidad de varios dias de un sendero (ADR-008). Rechaza fechas pasadas,
     * dias repetidos y cupos por debajo de lo ya reservado. Cada dia se bloquea mientras se
     * actualiza para no cruzarse con una reserva en curso.
     */
    @Transactional
    public List<CapacidadDiaResponse> cargarDias(Long senderoId, List<CapacidadDiaRequest> dias, UUID usuarioId) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new ResourceNotFoundException("Sendero no encontrado");
        }
        LocalDate hoy = LocalDate.now(reloj);
        Set<LocalDate> fechas = new HashSet<>();
        for (CapacidadDiaRequest dia : dias) {
            if (!fechas.add(dia.fecha())) {
                throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "El dia " + dia.fecha() + " viene repetido");
            }
            if (dia.fecha().isBefore(hoy)) {
                throw new BusinessRuleException(
                        HttpStatus.BAD_REQUEST, "No se puede cargar capacidad para una fecha pasada (" + dia.fecha() + ")");
            }
        }

        return dias.stream()
                .sorted(Comparator.comparing(CapacidadDiaRequest::fecha))
                .map(dia -> guardarDia(senderoId, dia, usuarioId))
                .toList();
    }

    private CapacidadDiaResponse guardarDia(Long senderoId, CapacidadDiaRequest dia, UUID usuarioId) {
        short umbral = dia.umbralAlertaPct() != null ? dia.umbralAlertaPct() : UMBRAL_ALERTA_POR_DEFECTO;
        CapacidadDia existente = capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(senderoId, dia.fecha())
                .orElse(null);

        int ocupacion = ocupacionDelDia.personasReservadas(senderoId, dia.fecha());
        if (dia.cupoMaximo() < ocupacion) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "El cupo del " + dia.fecha() + " no puede quedar por debajo de las " + ocupacion + " personas ya reservadas");
        }

        CapacidadDia guardado;
        if (existente == null) {
            guardado = capacidadDiaRepository.save(
                    new CapacidadDia(senderoId, dia.fecha(), dia.cupoMaximo(), umbral, usuarioId));
        } else {
            existente.actualizar(dia.cupoMaximo(), umbral, usuarioId);
            guardado = existente;
        }
        return CapacidadDiaResponse.from(guardado, ocupacion);
    }

    /**
     * Ultimo dia en que se puede reservar con cobro: el domingo de la semana siguiente (ADR-008).
     * Las semanas de operacion van de lunes a domingo.
     */
    public LocalDate ultimoDiaReservable() {
        return LocalDate.now(reloj).with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).plusWeeks(1);
    }

    /** @throws BusinessRuleException si la fecha queda despues de la semana siguiente. */
    public void verificarVentanaDeReserva(LocalDate fecha) {
        LocalDate ultimoDia = ultimoDiaReservable();
        if (fecha.isAfter(ultimoDia)) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "Por ahora se puede reservar hasta el " + ultimoDia + "; la capacidad de fechas posteriores aun no se publica");
        }
    }

    /**
     * Bloquea la capacidad del dia hasta que termine la transaccion de quien llama (ADR-008). Debe
     * llamarse antes de leer la ocupacion: asi dos reservas simultaneas para el mismo sendero y dia
     * se atienden una tras otra y la segunda ve la ocupacion ya actualizada (BUG-01).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public CapacidadDia bloquearCapacidadDelDia(Long senderoId, LocalDate fecha) {
        return capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(senderoId, fecha)
                .orElseThrow(() -> sinCapacidadCargada(fecha));
    }

    /**
     * @param ocupacionActual suma de personas ya reservadas para el sendero/fecha (calculada por ReservaService).
     */
    @Transactional(readOnly = true)
    public DisponibilidadResponse verificarDisponibilidad(Long senderoId, LocalDate fecha, int ocupacionActual) {
        CapacidadDia dia = capacidadDelDia(senderoId, fecha);
        return new DisponibilidadResponse(
                senderoId,
                fecha,
                dia.getCupoMaximo(),
                ocupacionActual,
                Math.max(dia.getCupoMaximo() - ocupacionActual, 0),
                dia.umbralSuperadoCon(ocupacionActual));
    }

    /**
     * @throws BusinessRuleException si no hay cupo suficiente para la cantidad solicitada.
     */
    @Transactional(readOnly = true)
    public void verificarCupoSuficiente(Long senderoId, LocalDate fecha, int ocupacionActual, int cantidadSolicitada) {
        CapacidadDia dia = capacidadDelDia(senderoId, fecha);
        if (ocupacionActual + cantidadSolicitada > dia.getCupoMaximo()) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "El cupo maximo del sendero para esta fecha ha sido excedido");
        }
    }

    private CapacidadDia capacidadDelDia(Long senderoId, LocalDate fecha) {
        return capacidadDiaRepository.findBySenderoIdAndFecha(senderoId, fecha)
                .orElseThrow(() -> sinCapacidadCargada(fecha));
    }

    private static BusinessRuleException sinCapacidadCargada(LocalDate fecha) {
        return new BusinessRuleException(
                HttpStatus.CONFLICT, "El sendero aun no tiene capacidad de carga publicada para el " + fecha);
    }
}
