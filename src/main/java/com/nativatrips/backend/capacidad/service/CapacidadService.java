package com.nativatrips.backend.capacidad.service;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaRequest;
import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.CargaCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadResponse;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.capacidad.repository.LimiteCapacidadRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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

    private final LimiteCapacidadRepository limiteCapacidadRepository;
    private final CapacidadDiaRepository capacidadDiaRepository;
    private final SenderoRepository senderoRepository;
    private final OcupacionDelDia ocupacionDelDia;
    private final Clock reloj;

    public CapacidadService(
            LimiteCapacidadRepository limiteCapacidadRepository,
            CapacidadDiaRepository capacidadDiaRepository,
            SenderoRepository senderoRepository,
            OcupacionDelDia ocupacionDelDia,
            Clock reloj) {
        this.limiteCapacidadRepository = limiteCapacidadRepository;
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

    @Transactional(readOnly = true)
    public List<LimiteCapacidadResponse> listarPorSendero(Long senderoId) {
        return limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId).stream()
                .map(LimiteCapacidadResponse::from)
                .toList();
    }

    @Transactional
    public LimiteCapacidadResponse crear(Long senderoId, LimiteCapacidadRequest request, UUID usuarioId) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new ResourceNotFoundException("Sendero no encontrado");
        }
        validarTemporada(request.temporadaInicio(), request.temporadaFin());
        validarSinSolape(senderoId, request.temporadaInicio(), request.temporadaFin(), null);

        boolean esExterno = request.configuradoPorExterno() != null && !request.configuradoPorExterno().isBlank();
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId,
                request.temporadaInicio(),
                request.temporadaFin(),
                request.cupoMaximoDia(),
                request.umbralAlertaPct() != null ? request.umbralAlertaPct() : 80,
                esExterno ? null : usuarioId,
                esExterno ? request.configuradoPorExterno() : null);

        return LimiteCapacidadResponse.from(limiteCapacidadRepository.save(limite));
    }

    @Transactional
    public LimiteCapacidadResponse actualizar(Long id, LimiteCapacidadRequest request) {
        LimiteCapacidad limite = limiteCapacidadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Limite de capacidad no encontrado"));

        validarTemporada(request.temporadaInicio(), request.temporadaFin());
        validarSinSolape(limite.getSenderoId(), request.temporadaInicio(), request.temporadaFin(), id);

        limite.setTemporada(request.temporadaInicio(), request.temporadaFin());
        limite.setCupoMaximoDia(request.cupoMaximoDia());
        limite.setUmbralAlertaPct(request.umbralAlertaPct() != null ? request.umbralAlertaPct() : 80);

        return LimiteCapacidadResponse.from(limite);
    }

    @Transactional(readOnly = true)
    public LimiteCapacidad obtenerLimiteVigente(Long senderoId, LocalDate fecha) {
        return limiteCapacidadRepository.findVigentePara(senderoId, fecha)
                .orElseThrow(() -> new BusinessRuleException(
                        HttpStatus.CONFLICT,
                        "No hay un limite de capacidad configurado para este sendero en la fecha solicitada"));
    }

    /**
     * Bloquea el limite vigente del sendero para la fecha hasta que termine la transaccion de quien
     * llama (ADR-008). Debe llamarse antes de leer la ocupacion: asi dos reservas simultaneas para
     * el mismo dia se atienden una tras otra y la segunda ve la ocupacion ya actualizada (BUG-01).
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public LimiteCapacidad bloquearLimiteVigente(Long senderoId, LocalDate fecha) {
        return limiteCapacidadRepository.findVigenteParaConBloqueo(senderoId, fecha)
                .orElseThrow(() -> new BusinessRuleException(
                        HttpStatus.CONFLICT,
                        "No hay un limite de capacidad configurado para este sendero en la fecha solicitada"));
    }

    /**
     * @param ocupacionActual suma de personas ya reservadas para el sendero/fecha (calculada por ReservaService).
     */
    @Transactional(readOnly = true)
    public DisponibilidadResponse verificarDisponibilidad(Long senderoId, LocalDate fecha, int ocupacionActual) {
        LimiteCapacidad limite = obtenerLimiteVigente(senderoId, fecha);
        int cupoDisponible = limite.getCupoMaximoDia() - ocupacionActual;
        boolean umbralSuperado =
                ocupacionActual * 100.0 / limite.getCupoMaximoDia() >= limite.getUmbralAlertaPct();

        return new DisponibilidadResponse(
                senderoId, fecha, limite.getCupoMaximoDia(), ocupacionActual, Math.max(cupoDisponible, 0), umbralSuperado);
    }

    /**
     * @throws BusinessRuleException si no hay cupo suficiente para la cantidad solicitada.
     */
    @Transactional(readOnly = true)
    public void verificarCupoSuficiente(Long senderoId, LocalDate fecha, int ocupacionActual, int cantidadSolicitada) {
        LimiteCapacidad limite = obtenerLimiteVigente(senderoId, fecha);
        if (ocupacionActual + cantidadSolicitada > limite.getCupoMaximoDia()) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "El cupo maximo del sendero para esta fecha ha sido excedido");
        }
    }

    private void validarTemporada(LocalDate inicio, LocalDate fin) {
        if (fin.isBefore(inicio)) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "La fecha de fin de temporada no puede ser anterior a la de inicio");
        }
    }

    private void validarSinSolape(Long senderoId, LocalDate inicio, LocalDate fin, Long idExcluido) {
        boolean solapa = limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId).stream()
                .filter(existente -> !Objects.equals(existente.getId(), idExcluido))
                .anyMatch(existente -> existente.seSolapaCon(inicio, fin));

        if (solapa) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Ya existe un limite de capacidad configurado que se solapa con esa temporada");
        }
    }
}
