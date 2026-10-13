package com.nativatrips.backend.capacidad.service;

import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadResponse;
import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import com.nativatrips.backend.capacidad.repository.LimiteCapacidadRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de capacidad de carga (RF-23 a RF-26). No conoce reservas: ReservaService le pasa la
 * ocupacion ya calculada para mantener la dependencia en un solo sentido (reservas -> capacidad).
 */
@Service
public class CapacidadService {

    private final LimiteCapacidadRepository limiteCapacidadRepository;
    private final SenderoRepository senderoRepository;

    public CapacidadService(
            LimiteCapacidadRepository limiteCapacidadRepository, SenderoRepository senderoRepository) {
        this.limiteCapacidadRepository = limiteCapacidadRepository;
        this.senderoRepository = senderoRepository;
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
