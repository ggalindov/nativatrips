package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.panel.service.AvisosDeOperacion;
import com.nativatrips.backend.reservas.dto.AcompananteRequest;
import com.nativatrips.backend.reservas.dto.IntegranteResponse;
import com.nativatrips.backend.reservas.dto.ReservaApartadaResponse;
import com.nativatrips.backend.reservas.dto.ReservaResponse;
import com.nativatrips.backend.reservas.dto.ReservaSinCuentaRequest;
import com.nativatrips.backend.reservas.dto.TitularRequest;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaEstadoHistorial;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.reservas.repository.ReservaEstadoHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.repository.SolicitudReprogramacionRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
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

    static final int MAX_DIAS_PANEL = 62;

    private static final DateTimeFormatter HORA =
            DateTimeFormatter.ofPattern("HH:mm").withZone(RelojConfig.ZONA_OPERACION);

    private final ReservaRepository reservaRepository;
    private final ReservaIntegranteRepository reservaIntegranteRepository;
    private final ReservaEstadoHistorialRepository historialRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CapacidadService capacidadService;
    private final NotificacionService notificacionService;
    private final GeneradorCodigoReserva generadorCodigo;
    private final EnlaceReservaService enlaceService;
    private final AvisosDeOperacion avisosDeOperacion;
    private final SolicitudReprogramacionRepository solicitudReprogramacionRepository;

    public ReservaService(
            ReservaRepository reservaRepository,
            ReservaIntegranteRepository reservaIntegranteRepository,
            ReservaEstadoHistorialRepository historialRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            CapacidadService capacidadService,
            NotificacionService notificacionService,
            GeneradorCodigoReserva generadorCodigo,
            EnlaceReservaService enlaceService,
            AvisosDeOperacion avisosDeOperacion,
            SolicitudReprogramacionRepository solicitudReprogramacionRepository) {
        this.reservaRepository = reservaRepository;
        this.reservaIntegranteRepository = reservaIntegranteRepository;
        this.historialRepository = historialRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.capacidadService = capacidadService;
        this.notificacionService = notificacionService;
        this.generadorCodigo = generadorCodigo;
        this.enlaceService = enlaceService;
        this.avisosDeOperacion = avisosDeOperacion;
        this.solicitudReprogramacionRepository = solicitudReprogramacionRepository;
    }

    /**
     * HU-02 (ADR-004): reserva sin cuenta. Aparta el cupo y envia al correo del titular el codigo y
     * el enlace magico para gestionarla (HU-18). La reserva estandar queda 15 minutos para pagar; un
     * grupo corporativo o con necesidades especiales espera la aprobacion del administrador (RF-09).
     */
    @Transactional
    public ReservaApartadaResponse crearReservaSinCuenta(ReservaSinCuentaRequest request) {
        TitularRequest datos = request.titular();
        ReglasPersona.validarDocumento(datos.tipoDocumento(), datos.documento(), datos.nacionalidad());
        ReglasPersona.validarCelular(datos.indicativo(), datos.celular());
        if (request.acompanantes().size() > request.personas() - 1) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "Hay mas acompanantes que personas en la reserva, sin contar al titular");
        }
        request.acompanantes().forEach(a -> ReglasPersona.validarDocumento(a.tipoDocumento(), a.documento(), a.nacionalidad()));
        if (request.tipoGrupo() == TipoGrupo.NECESIDAD_ESPECIAL && request.requerimientosEspeciales() == null) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "Cuentanos que necesita el grupo para que el guia lo tenga en cuenta");
        }
        Sendero sendero = apartarCupo(request.senderoId(), request.fechaTour(), request.personas());

        TitularReserva titular = new TitularReserva(
                datos.nombre().trim(), datos.tipoDocumento(), datos.documento().trim(), datos.nacionalidad(),
                datos.correo().trim().toLowerCase(Locale.ROOT), datos.indicativo(), datos.celular());
        Reserva reserva = reservaRepository.save(Reserva.sinCuenta(
                sendero.getId(),
                request.fechaTour(),
                request.personas(),
                request.tipoGrupo(),
                request.requerimientosEspeciales(),
                Instant.now().plus(BLOQUEO_MINUTOS, ChronoUnit.MINUTES),
                codigoNuevo(),
                titular));

        reservaIntegranteRepository.save(new ReservaIntegrante(
                reserva.getId(), titular.getNombre(), titular.getTipoDocumento(), titular.getDocumento(),
                titular.getNacionalidad()));
        for (AcompananteRequest a : request.acompanantes()) {
            reservaIntegranteRepository.save(new ReservaIntegrante(
                    reserva.getId(), a.nombre().trim(), a.tipoDocumento(), a.documento().trim(), a.nacionalidad()));
        }
        boolean enRevision = reserva.getEstado() == EstadoReserva.EN_REVISION;
        historialRepository.save(new ReservaEstadoHistorial(
                reserva.getId(), null, reserva.getEstado(),
                enRevision
                        ? "Reserva sin cuenta creada, pendiente de revision por tipo de grupo (" + reserva.getTipoGrupo() + ")"
                        : "Reserva sin cuenta creada, pendiente de pago",
                OrigenCambioEstado.TURISTA, null));

        avisosDeOperacion.reserva(reserva, sendero);
        EnlaceReservaService.EnlaceEmitido enlace = enlaceService.emitir(reserva);
        if (enRevision) {
            notificarEnRevision(reserva, sendero, enlace);
            notificarAdministradoresRevisionPendiente(reserva, sendero);
        } else {
            notificarCupoApartado(reserva, sendero, enlace);
        }
        return ReservaApartadaResponse.from(reserva);
    }

    /** El sendero existe y esta activo, la fecha esta en la ventana y alcanza el cupo del dia. */
    private Sendero apartarCupo(Long senderoId, LocalDate fecha, int personas) {
        Sendero sendero = senderoRepository.findById(senderoId)
                .filter(Sendero::isVisible)
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));

        capacidadService.verificarVentanaDeReserva(fecha);
        // El bloqueo va antes de contar la ocupacion; sin el, dos reservas simultaneas ven la misma
        // ocupacion y ambas pasan (BUG-01).
        CapacidadDia dia = capacidadService.bloquearCapacidadDelDia(sendero.getId(), fecha);
        int ocupacionActual = ocupacionActual(sendero.getId(), fecha);
        capacidadService.verificarCupoSuficiente(sendero.getId(), fecha, ocupacionActual, personas);
        avisosDeOperacion.siCruzaElUmbral(dia, sendero, ocupacionActual, ocupacionActual + personas);
        return sendero;
    }

    /** Un choque es casi imposible (887 millones de codigos), pero se reintenta en vez de fallar. */
    private String codigoNuevo() {
        for (int intento = 0; intento < 5; intento++) {
            String codigo = generadorCodigo.generar();
            if (!reservaRepository.existsByCodigoReserva(codigo)) {
                return codigo;
            }
        }
        throw new IllegalStateException("No se pudo generar un codigo de reserva unico");
    }

    private void notificarCupoApartado(Reserva reserva, Sendero sendero, EnlaceReservaService.EnlaceEmitido enlace) {
        String venceA = HORA.format(reserva.getBloqueoExpiraEn());
        notificacionService.enviarCorreo(
                reserva.getTitular().getCorreo(),
                "Tu cupo esta apartado - NativaTrips " + reserva.getCodigoReserva(),
                "Hola " + reserva.getTitular().getNombre() + ". Apartamos " + reserva.getCantidadPersonas()
                        + " cupo(s) en " + sendero.getNombre() + " para el " + reserva.getFechaTour()
                        + ". Tu codigo de reserva es " + reserva.getCodigoReserva()
                        + ". El cupo se guarda hasta las " + venceA + " (hora de Colombia) mientras completas el pago."
                        + "\n\nDesde este enlace pagas, registras a tus acompanantes y consultas tu reserva:\n"
                        + enlace.url()
                        + "\n\nEs personal: no lo compartas. Si lo pierdes, pide uno nuevo con tu correo y el codigo.");
    }

    private void notificarEnRevision(Reserva reserva, Sendero sendero, EnlaceReservaService.EnlaceEmitido enlace) {
        notificacionService.enviarCorreo(
                reserva.getTitular().getCorreo(),
                "Recibimos tu solicitud - NativaTrips " + reserva.getCodigoReserva(),
                "Hola " + reserva.getTitular().getNombre() + ". Guardamos " + reserva.getCantidadPersonas()
                        + " cupo(s) en " + sendero.getNombre() + " para el " + reserva.getFechaTour()
                        + ". Como es un " + descripcion(reserva.getTipoGrupo()) + ", el equipo de Eco Palacio la revisa"
                        + " antes del pago. Te escribimos apenas la aprueben; desde ese momento tienes "
                        + BLOQUEO_MINUTOS + " minutos para pagar."
                        + "\n\nDesde este enlace consultas el estado de tu reserva:\n"
                        + enlace.url()
                        + "\n\nEs personal: no lo compartas.");
    }

    private static String descripcion(TipoGrupo tipo) {
        return tipo == TipoGrupo.GRUPO_CORPORATIVO ? "grupo corporativo" : "grupo con necesidades especiales";
    }

    /**
     * RF-08/RF-09: el administrador aprueba o rechaza una reserva de grupo corporativo o con
     * necesidad especial. Al aprobar arranca el conteo de pago (RF-05) y el titular recibe un enlace
     * nuevo para pagar; al rechazar, el aviso con el motivo.
     */
    @Transactional
    public ReservaResponse revisarReserva(UUID reservaId, boolean aprobar, String motivo, UUID adminId) {
        Reserva actual = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada"));

        if (actual.getEstado() != EstadoReserva.EN_REVISION) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva no esta pendiente de revision manual");
        }
        if (reprogramacionPendiente(actual)) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva espera una decision de reprogramacion; resuelvela en esa bandeja");
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
            avisarRevisionAprobada(actualizada);
        } else {
            actualizada = transicionarEstado(
                    reservaId,
                    EstadoReserva.CANCELADA,
                    motivo != null && !motivo.isBlank() ? motivo : "Revision rechazada por el administrador",
                    OrigenCambioEstado.ADMINISTRADOR,
                    adminId);
            avisarRevisionRechazada(actualizada, motivo);
        }

        return conIntegrantes(actualizada);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarEnRevision() {
        return reservaRepository.findByEstadoOrderByCreatedAtAsc(EstadoReserva.EN_REVISION).stream()
                .filter(r -> !reprogramacionPendiente(r))
                .map(this::conIntegrantes)
                .toList();
    }

    /** RF-08: reservas del panel entre dos fechas de tour (maximo 62 dias), opcionalmente de un estado. */
    @Transactional(readOnly = true)
    public List<ReservaResponse> listarParaPanel(LocalDate desde, LocalDate hasta, EstadoReserva estado) {
        if (hasta.isBefore(desde) || desde.plusDays(MAX_DIAS_PANEL).isBefore(hasta)) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "El rango del panel va de 1 a " + MAX_DIAS_PANEL + " dias");
        }
        return reservaRepository.findByFechaTourBetweenOrderByFechaTourAscCreatedAtAsc(desde, hasta).stream()
                .filter(r -> estado == null || r.getEstado() == estado)
                .map(this::conIntegrantes)
                .toList();
    }

    private boolean reprogramacionPendiente(Reserva reserva) {
        return solicitudReprogramacionRepository.existsByReservaIdAndEstado(
                reserva.getId(), EstadoSolicitudReprogramacion.PENDIENTE);
    }

    private void avisarRevisionAprobada(Reserva reserva) {
        if (reserva.getTitular() == null) {
            return;
        }
        String sendero = senderoRepository.findById(reserva.getSenderoId()).map(Sendero::getNombre).orElse("el sendero");
        notificacionService.enviarCorreo(
                reserva.getTitular().getCorreo(),
                "Tu reserva fue aprobada - NativaTrips " + reserva.getCodigoReserva(),
                "Hola " + reserva.getTitular().getNombre() + ". El equipo aprobó tu reserva en " + sendero
                        + " para el " + reserva.getFechaTour() + ". Tienes hasta las "
                        + HORA.format(reserva.getBloqueoExpiraEn()) + " (hora de Colombia) para pagar desde este enlace:"
                        + "\n\n" + enlaceService.emitir(reserva).url()
                        + "\n\nLos enlaces que recibiste antes ya no sirven.");
    }

    private void avisarRevisionRechazada(Reserva reserva, String motivo) {
        if (reserva.getTitular() == null) {
            return;
        }
        notificacionService.enviarCorreo(
                reserva.getTitular().getCorreo(),
                "Tu reserva no fue aprobada - NativaTrips " + reserva.getCodigoReserva(),
                "Hola " + reserva.getTitular().getNombre() + ". El equipo de Eco Palacio no pudo aprobar tu reserva para el "
                        + reserva.getFechaTour() + (motivo != null && !motivo.isBlank() ? ": " + motivo.strip() : ".")
                        + "\n\nNo se hizo ningún cobro y los cupos quedaron libres. Escríbenos si quieres buscar otra fecha.");
    }

    private void notificarAdministradoresRevisionPendiente(Reserva reserva, Sendero sendero) {
        String asunto = "Nueva reserva en revisión - " + reserva.getCodigoReserva();
        String cuerpo = "La reserva " + reserva.getCodigoReserva() + " de " + reserva.getTitular().getNombre() + " ("
                + descripcion(reserva.getTipoGrupo()) + ", " + reserva.getCantidadPersonas() + " personas) en "
                + sendero.getNombre() + " para el " + reserva.getFechaTour() + " espera tu aprobación antes del pago."
                + (reserva.getRequerimientosEspeciales() != null
                        ? "\n\nRequerimientos: " + reserva.getRequerimientosEspeciales()
                        : "");
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
        senderoRepository.findById(reserva.getSenderoId()).ifPresent(s -> avisosDeOperacion.reserva(reserva, s));

        return reserva;
    }

    @Transactional(readOnly = true)
    public DisponibilidadResponse obtenerDisponibilidad(Long senderoId, LocalDate fecha) {
        if (!senderoRepository.existsById(senderoId)) {
            throw new ResourceNotFoundException("Sendero no encontrado");
        }
        int ocupacion = ocupacionActual(senderoId, fecha);
        return capacidadService.verificarDisponibilidad(senderoId, fecha, ocupacion);
    }

    /** RF-35: reservas que siguen en pie desde hoy; el administrador las ve antes de dar de baja el sendero. */
    @Transactional(readOnly = true)
    public long contarReservasFuturas(Long senderoId) {
        return reservaRepository.contarDesde(senderoId, LocalDate.now(), EstadoReserva.queOcupanCupo());
    }

    private int ocupacionActual(Long senderoId, LocalDate fecha) {
        return reservaRepository.sumarPersonasActivas(senderoId, fecha, EstadoReserva.queOcupanCupo());
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
                .map(i -> IntegranteResponse.conVisitas(i, reservaIntegranteRepository.contarVisitasPrevias(
                        i.getTipoDocumento(), i.getDocumentoIdentidad(), reserva.getId(), EstadoReserva.COMPLETADA)))
                .toList();
    }

    /** RF-12: el guia asignado marca, persona por persona, quien llego a la salida. */
    @Transactional
    public IntegranteResponse marcarAsistenciaIntegrante(UUID reservaId, UUID integranteId, boolean asistio, UUID guiaId) {
        Reserva reserva = buscarDelGuia(reservaId, guiaId);
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Solo se marca asistencia en una reserva confirmada");
        }
        ReservaIntegrante integrante = reservaIntegranteRepository.findById(integranteId)
                .filter(i -> reserva.getId().equals(i.getReservaId()))
                .orElseThrow(() -> new ResourceNotFoundException("Persona no encontrada en la reserva"));
        integrante.setAsistio(asistio);
        return IntegranteResponse.from(integrante);
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
        String guia = reserva.getGuiaId() == null
                ? null
                : usuarioRepository.findById(reserva.getGuiaId()).map(Usuario::getNombreCompleto).orElse(null);
        return ReservaResponse.from(reserva, guia, integrantes);
    }
}
