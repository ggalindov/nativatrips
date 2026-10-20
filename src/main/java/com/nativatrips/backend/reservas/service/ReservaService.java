package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.dto.HistorialEntradaResponse;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.dto.ReservaRequest;
import com.nativatrips.backend.reservas.dto.ReservaResponse;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaEstadoHistorial;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaEstadoHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ReservaService depende de CapacidadService, nunca al reves: la capacidad de carga no conoce
 * la existencia de reservas, solo evalua limites que le pasan como parametros ya calculados.
 */
@Service
public class ReservaService {

    /** Tiempo que se retiene el cupo mientras el turista completa el pago (RF-05). */
    static final long BLOQUEO_MINUTOS = 15;

    private static final List<EstadoReserva> ESTADOS_QUE_OCUPAN_CUPO =
            List.of(EstadoReserva.PENDIENTE_PAGO, EstadoReserva.EN_REVISION, EstadoReserva.CONFIRMADA);

    /** RF-08/RF-09: estos tipos de grupo no pasan directo a pago, requieren aprobacion del administrador. */
    private static final List<TipoGrupo> TIPOS_QUE_REQUIEREN_REVISION =
            List.of(TipoGrupo.GRUPO_CORPORATIVO, TipoGrupo.NECESIDAD_ESPECIAL);

    /** RF-37: una reserva ya cancelada, expirada o completada no se puede volver a cancelar. */
    private static final List<EstadoReserva> ESTADOS_CANCELABLES_POR_TURISTA =
            List.of(EstadoReserva.PENDIENTE_PAGO, EstadoReserva.EN_REVISION, EstadoReserva.CONFIRMADA);

    private final ReservaRepository reservaRepository;
    private final ReservaIntegranteRepository reservaIntegranteRepository;
    private final ReservaEstadoHistorialRepository historialRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CapacidadService capacidadService;
    private final NotificacionService notificacionService;

    public ReservaService(
            ReservaRepository reservaRepository,
            ReservaIntegranteRepository reservaIntegranteRepository,
            ReservaEstadoHistorialRepository historialRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            CapacidadService capacidadService,
            NotificacionService notificacionService) {
        this.reservaRepository = reservaRepository;
        this.reservaIntegranteRepository = reservaIntegranteRepository;
        this.historialRepository = historialRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.capacidadService = capacidadService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public ReservaResponse crearReserva(ReservaRequest request, UUID turistaId) {
        Sendero sendero = senderoRepository.findById(request.senderoId())
                .filter(Sendero::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));

        int cantidadPersonas = request.integrantes().size();
        // El bloqueo va antes de contar la ocupacion; sin el, dos reservas simultaneas ven la misma
        // ocupacion y ambas pasan (BUG-01).
        capacidadService.bloquearLimiteVigente(sendero.getId(), request.fechaTour());
        int ocupacionActual = ocupacionActual(sendero.getId(), request.fechaTour());
        capacidadService.verificarCupoSuficiente(sendero.getId(), request.fechaTour(), ocupacionActual, cantidadPersonas);

        boolean requiereRevision = TIPOS_QUE_REQUIEREN_REVISION.contains(request.tipoGrupo());
        Instant bloqueoExpiraEn = requiereRevision ? null : Instant.now().plus(BLOQUEO_MINUTOS, ChronoUnit.MINUTES);

        Reserva reserva = new Reserva(
                sendero.getId(), turistaId, request.fechaTour(), cantidadPersonas, request.tipoGrupo(), bloqueoExpiraEn);
        if (requiereRevision) {
            reserva.setEstado(EstadoReserva.EN_REVISION);
        }
        final Reserva reservaGuardada = reservaRepository.save(reserva);

        List<ReservaIntegrante> integrantes = request.integrantes().stream()
                .map(i -> reservaIntegranteRepository.save(
                        new ReservaIntegrante(reservaGuardada.getId(), i.nombreCompleto(), i.documentoIdentidad())))
                .toList();

        EstadoReserva estadoInicial = requiereRevision ? EstadoReserva.EN_REVISION : EstadoReserva.PENDIENTE_PAGO;
        String motivoInicial = requiereRevision
                ? "Reserva creada, pendiente de revision manual por tipo de grupo (" + request.tipoGrupo() + ")"
                : "Reserva creada, pendiente de pago";
        historialRepository.save(new ReservaEstadoHistorial(
                reservaGuardada.getId(), null, estadoInicial, motivoInicial, OrigenCambioEstado.SISTEMA, turistaId));

        if (requiereRevision) {
            notificarAdministradoresRevisionPendiente(reservaGuardada);
        }

        return ReservaResponse.from(reservaGuardada, integrantes.stream().map(IntegranteResponse::from).toList());
    }

    /**
     * RF-08/RF-09: el administrador aprueba o rechaza una reserva de grupo corporativo o
     * con necesidad especial. Al aprobar arranca el conteo de bloqueo temporal de pago (RF-05).
     */
    @Transactional
    public ReservaResponse revisarReserva(UUID reservaId, boolean aprobar, String motivo, UUID adminId) {
        Reserva actual = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        if (actual.getEstado() != EstadoReserva.EN_REVISION) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva no esta pendiente de revision manual");
        }

        Reserva actualizada;
        if (aprobar) {
            actualizada = transicionarEstado(
                    reservaId,
                    EstadoReserva.PENDIENTE_PAGO,
                    motivo != null && !motivo.isBlank() ? motivo : "Revision aprobada por el administrador",
                    OrigenCambioEstado.ADMINISTRADOR,
                    adminId);
            actualizada.setBloqueoExpiraEn(Instant.now().plus(BLOQUEO_MINUTOS, ChronoUnit.MINUTES));
        } else {
            actualizada = transicionarEstado(
                    reservaId,
                    EstadoReserva.CANCELADA,
                    motivo != null && !motivo.isBlank() ? motivo : "Revision rechazada por el administrador",
                    OrigenCambioEstado.ADMINISTRADOR,
                    adminId);
        }

        return conIntegrantes(actualizada);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarEnRevision() {
        return reservaRepository.findByEstadoOrderByCreatedAtAsc(EstadoReserva.EN_REVISION).stream()
                .map(this::conIntegrantes)
                .toList();
    }

    private void notificarAdministradoresRevisionPendiente(Reserva reserva) {
        String asunto = "Nueva reserva pendiente de revision manual";
        String cuerpo = "La reserva " + reserva.getId() + " (tipo " + reserva.getTipoGrupo()
                + ") requiere aprobacion antes de continuar al pago.";
        for (Usuario admin : usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR)) {
            notificacionService.enviarCorreo(admin.getEmail(), asunto, cuerpo);
        }
    }

    @Transactional
    public Reserva transicionarEstado(
            UUID reservaId, EstadoReserva nuevoEstado, String motivo, OrigenCambioEstado origen, UUID cambiadoPorUsuarioId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        EstadoReserva anterior = reserva.getEstado();
        reserva.setEstado(nuevoEstado);
        if (nuevoEstado == EstadoReserva.CONFIRMADA || nuevoEstado == EstadoReserva.CANCELADA
                || nuevoEstado == EstadoReserva.EXPIRADA) {
            reserva.setBloqueoExpiraEn(null);
        }

        historialRepository.save(
                new ReservaEstadoHistorial(reservaId, anterior, nuevoEstado, motivo, origen, cambiadoPorUsuarioId));

        return reserva;
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarMisReservas(UUID turistaId) {
        return reservaRepository.findByTuristaIdOrderByFechaTourDesc(turistaId).stream()
                .map(this::conIntegrantes)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtenerParaTurista(UUID reservaId, UUID turistaId) {
        Reserva reserva = buscarDelTurista(reservaId, turistaId);
        return conIntegrantes(reserva);
    }

    /** RF-36: historial completo de transiciones de una reserva propia, mas antiguo primero. */
    @Transactional(readOnly = true)
    public List<HistorialEntradaResponse> obtenerHistorialParaTurista(UUID reservaId, UUID turistaId) {
        buscarDelTurista(reservaId, turistaId);
        return historialRepository.findByReservaIdOrderByCreatedAtAsc(reservaId).stream()
                .map(HistorialEntradaResponse::from)
                .toList();
    }

    /** RF-37: el turista cancela su propia reserva mientras no este ya cerrada. */
    @Transactional
    public ReservaResponse cancelarPorTurista(UUID reservaId, UUID turistaId, String motivo) {
        Reserva reserva = buscarDelTurista(reservaId, turistaId);

        if (!ESTADOS_CANCELABLES_POR_TURISTA.contains(reserva.getEstado())) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva no se puede cancelar en su estado actual (" + reserva.getEstado() + ")");
        }

        Reserva actualizada = transicionarEstado(
                reservaId,
                EstadoReserva.CANCELADA,
                motivo != null && !motivo.isBlank() ? motivo : "Cancelada por el turista",
                OrigenCambioEstado.TURISTA,
                turistaId);

        return conIntegrantes(actualizada);
    }

    private Reserva buscarDelTurista(UUID reservaId, UUID turistaId) {
        return reservaRepository.findById(reservaId)
                .filter(r -> r.getTuristaId().equals(turistaId))
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse obtenerDisponibilidad(Long senderoId, LocalDate fecha) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new ResourceNotFoundException("Sendero no encontrado");
        }
        int ocupacion = ocupacionActual(senderoId, fecha);
        return capacidadService.verificarDisponibilidad(senderoId, fecha, ocupacion);
    }

    private int ocupacionActual(Long senderoId, LocalDate fecha) {
        return reservaRepository.sumarPersonasActivas(senderoId, fecha, ESTADOS_QUE_OCUPAN_CUPO);
    }

    /** RF-11: el administrador asigna un guia a una reserva ya confirmada. */
    @Transactional
    public ReservaResponse asignarGuia(UUID reservaId, UUID guiaId) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Solo se puede asignar un guia a una reserva confirmada");
        }

        Usuario guia = usuarioRepository.findById(guiaId)
                .filter(u -> u.getRol() == Rol.GUIA_TURISTICO && u.isActivo())
                .orElseThrow(() -> new ResourceNotFoundException("Guia no encontrado o inactivo"));

        reserva.setGuiaId(guia.getId());
        return conIntegrantes(reserva);
    }

    /** RF-12: agenda del guia autenticado; sin fecha devuelve los tours confirmados desde hoy. */
    @Transactional(readOnly = true)
    public List<ReservaResponse> obtenerAgendaGuia(UUID guiaId, LocalDate fecha) {
        List<Reserva> reservas = fecha != null
                ? reservaRepository.findByGuiaIdAndFechaTourOrderByFechaTourAsc(guiaId, fecha)
                : reservaRepository.findByGuiaIdOrderByFechaTourAsc(guiaId).stream()
                        .filter(r -> !r.getFechaTour().isBefore(LocalDate.now()))
                        .toList();
        return reservas.stream().map(this::conIntegrantes).toList();
    }

    /** RF-12: listado de turistas de una reserva, visible solo para el guia asignado. */
    @Transactional(readOnly = true)
    public List<IntegranteResponse> obtenerTuristasParaGuia(UUID reservaId, UUID guiaId) {
        Reserva reserva = buscarDelGuia(reservaId, guiaId);
        return reservaIntegranteRepository.findByReservaId(reserva.getId()).stream()
                .map(IntegranteResponse::from)
                .toList();
    }

    /** RF-38: el guia asignado cierra el tour registrando la asistencia el mismo dia o despues. */
    @Transactional
    public ReservaResponse registrarAsistencia(UUID reservaId, UUID guiaId) {
        Reserva reserva = buscarDelGuia(reservaId, guiaId);

        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Solo se puede registrar asistencia sobre una reserva confirmada");
        }
        if (reserva.getFechaTour().isAfter(LocalDate.now())) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "No se puede registrar asistencia antes de la fecha del tour");
        }

        reserva.setAsistenciaRegistradaEn(Instant.now());
        Reserva actualizada = transicionarEstado(
                reservaId,
                EstadoReserva.COMPLETADA,
                "Asistencia registrada por el guia",
                OrigenCambioEstado.GUIA_TURISTICO,
                guiaId);

        return conIntegrantes(actualizada);
    }

    private Reserva buscarDelGuia(UUID reservaId, UUID guiaId) {
        return reservaRepository.findById(reservaId)
                .filter(r -> guiaId.equals(r.getGuiaId()))
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));
    }

    private ReservaResponse conIntegrantes(Reserva reserva) {
        List<IntegranteResponse> integrantes = reservaIntegranteRepository.findByReservaId(reserva.getId()).stream()
                .map(IntegranteResponse::from)
                .toList();
        return ReservaResponse.from(reserva, integrantes);
    }
}
