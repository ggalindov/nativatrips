package com.nativatrips.backend.reservas.service;

import static com.nativatrips.backend.common.correo.TextosCorreo.texto;

import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.common.archivos.AlmacenArchivos;
import com.nativatrips.backend.common.archivos.TipoArchivo;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.dto.SolicitudReprogramacionResponse;
import com.nativatrips.backend.reservas.model.CausalReprogramacion;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.SolicitudReprogramacion;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.repository.SolicitudReprogramacionRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * RF-37 (S4-18, Anexo 16). Una reserva confirmada no se cancela con devolucion: el titular solo
 * puede pedir otra fecha, con una de las tres causales y su soporte, hasta el dia del tour. La
 * solicitud deja la reserva EN_REVISION, ocupando su cupo original; el administrador aprueba la
 * nueva fecha si tiene cupo, o rechaza y la reserva queda cancelada sin devolucion.
 */
@Service
public class ReprogramacionService {

    static final long MAXIMO_SOPORTE_BYTES = 5L * 1024 * 1024;
    static final Set<TipoArchivo> SOPORTES = Set.of(TipoArchivo.PDF, TipoArchivo.JPEG, TipoArchivo.PNG);
    /** La nueva fecha se pide dentro del ano siguiente. */
    static final int MAXIMO_DIAS_ADELANTE = 365;

    private final EnlaceReservaService enlaceService;
    private final ReservaService reservaService;
    private final ReservaRepository reservaRepository;
    private final SolicitudReprogramacionRepository solicitudRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CapacidadService capacidadService;
    private final AlmacenArchivos almacen;
    private final NotificacionService notificacionService;
    private final Clock reloj;

    public ReprogramacionService(
            EnlaceReservaService enlaceService,
            ReservaService reservaService,
            ReservaRepository reservaRepository,
            SolicitudReprogramacionRepository solicitudRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            CapacidadService capacidadService,
            AlmacenArchivos almacen,
            NotificacionService notificacionService,
            Clock reloj) {
        this.enlaceService = enlaceService;
        this.reservaService = reservaService;
        this.reservaRepository = reservaRepository;
        this.solicitudRepository = solicitudRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.capacidadService = capacidadService;
        this.almacen = almacen;
        this.notificacionService = notificacionService;
        this.reloj = reloj;
    }

    @Transactional(noRollbackFor = BusinessRuleException.class)
    public SolicitudReprogramacionResponse solicitar(
            String token, CausalReprogramacion causal, String descripcion, LocalDate fechaDeseada,
            MultipartFile soporte, String ip) {
        Reserva reserva = enlaceService.abrir(token, "SOLICITAR_REPROGRAMACION", ip);
        LocalDate hoy = LocalDate.now(reloj);
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Solo se reprograma una reserva confirmada (estado " + reserva.getEstado() + ")");
        }
        if (reserva.getFechaTour().isBefore(hoy)) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "El tour ya paso; la reserva no se puede reprogramar");
        }
        if (causal == null || descripcion == null || descripcion.isBlank()) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "Elige la causal y cuentanos que paso");
        }
        if (fechaDeseada == null || !fechaDeseada.isAfter(hoy) || fechaDeseada.equals(reserva.getFechaTour())
                || fechaDeseada.isAfter(hoy.plusDays(MAXIMO_DIAS_ADELANTE))) {
            throw new BusinessRuleException(
                    HttpStatus.BAD_REQUEST, "Elige una fecha nueva, despues de hoy y dentro del proximo ano");
        }
        var guardado = almacen.guardar("soportes", soporte, SOPORTES, MAXIMO_SOPORTE_BYTES);

        SolicitudReprogramacion solicitud = solicitudRepository.save(new SolicitudReprogramacion(
                reserva.getId(), causal, descripcion.strip(), reserva.getFechaTour(), fechaDeseada, guardado.ruta(),
                guardado.tipo().mediaType(), reloj.instant()));
        reservaService.transicionarEstado(
                reserva.getId(), EstadoReserva.EN_REVISION, "Solicitud de reprogramacion por " + causal,
                OrigenCambioEstado.TURISTA, null);

        Sendero sendero = senderoRepository.findById(reserva.getSenderoId()).orElseThrow();
        notificacionService.enviarCorreo(
                reserva.getTitular().getCorreo(),
                texto(reserva.getIdioma(), "reprogramacion.solicitada.asunto", reserva.getCodigoReserva()),
                texto(reserva.getIdioma(), "reprogramacion.solicitada.cuerpo", reserva.getTitular().getNombre(),
                        sendero.getNombre(), reserva.getFechaTour(), fechaDeseada));
        for (Usuario admin : usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR)) {
            notificacionService.enviarCorreo(
                    admin.getEmail(),
                    "Solicitud de reprogramación - " + reserva.getCodigoReserva(),
                    reserva.getTitular().getNombre() + " pide pasar la reserva " + reserva.getCodigoReserva() + " ("
                            + sendero.getNombre() + ", " + reserva.getCantidadPersonas() + " personas) del "
                            + reserva.getFechaTour() + " al " + fechaDeseada + " por " + causal
                            + ".\n\nRevisa el soporte en el panel antes de decidir.");
        }
        return respuesta(solicitud, reserva);
    }

    @Transactional(readOnly = true)
    public List<SolicitudReprogramacionResponse> listar(EstadoSolicitudReprogramacion estado) {
        return solicitudRepository.findByEstadoOrderByCreatedAtAsc(estado).stream()
                .map(s -> respuesta(s, reservaRepository.findById(s.getReservaId()).orElseThrow()))
                .toList();
    }

    public record Soporte(byte[] contenido, String tipo) {
    }

    @Transactional(readOnly = true)
    public Soporte soporte(UUID solicitudId) {
        SolicitudReprogramacion solicitud = buscar(solicitudId);
        return new Soporte(almacen.leer(solicitud.getSoporteRuta()), solicitud.getSoporteTipo());
    }

    /**
     * Aprobar mueve la reserva a la nueva fecha si ese dia tiene cupo y la deja confirmada, con un
     * enlace nuevo; rechazar la cancela sin devolucion, como manda el Anexo 16.
     */
    @Transactional
    public SolicitudReprogramacionResponse decidir(
            UUID solicitudId, boolean aprobar, LocalDate nuevaFecha, String motivo, UUID adminId) {
        SolicitudReprogramacion solicitud = buscar(solicitudId);
        if (solicitud.getEstado() != EstadoSolicitudReprogramacion.PENDIENTE) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "La solicitud ya fue decidida");
        }
        Reserva reserva = reservaRepository.findById(solicitud.getReservaId()).orElseThrow();
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId()).orElseThrow();
        String motivoLimpio = motivo == null || motivo.isBlank() ? null : motivo.strip();

        if (aprobar) {
            LocalDate fecha = nuevaFecha != null ? nuevaFecha : solicitud.getFechaDeseada();
            if (!fecha.isAfter(LocalDate.now(reloj))) {
                throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "La nueva fecha debe ser posterior a hoy");
            }
            capacidadService.bloquearCapacidadDelDia(sendero.getId(), fecha);
            int ocupacion = reservaRepository.sumarPersonasActivas(sendero.getId(), fecha, EstadoReserva.queOcupanCupo());
            capacidadService.verificarCupoSuficiente(sendero.getId(), fecha, ocupacion, reserva.getCantidadPersonas());

            reserva.reprogramar(fecha);
            solicitud.decidir(true, adminId, motivoLimpio, reloj.instant());
            reservaService.transicionarEstado(
                    reserva.getId(), EstadoReserva.CONFIRMADA,
                    "Reprogramada del " + solicitud.getFechaOriginal() + " al " + fecha + " (" + solicitud.getCausal() + ")",
                    OrigenCambioEstado.ADMINISTRADOR, adminId);
            notificacionService.enviarCorreo(
                    reserva.getTitular().getCorreo(),
                    texto(reserva.getIdioma(), "reprogramacion.aprobada.asunto", reserva.getCodigoReserva()),
                    texto(reserva.getIdioma(), "reprogramacion.aprobada.cuerpo", reserva.getTitular().getNombre(),
                            sendero.getNombre(), fecha, enlaceService.emitir(reserva).url()));
        } else {
            solicitud.decidir(false, adminId, motivoLimpio, reloj.instant());
            reservaService.transicionarEstado(
                    reserva.getId(), EstadoReserva.CANCELADA,
                    "Reprogramacion rechazada (" + solicitud.getCausal() + ")" + (motivoLimpio != null ? ": " + motivoLimpio : ""),
                    OrigenCambioEstado.ADMINISTRADOR, adminId);
            notificacionService.enviarCorreo(
                    reserva.getTitular().getCorreo(),
                    texto(reserva.getIdioma(), "reprogramacion.rechazada.asunto", reserva.getCodigoReserva()),
                    texto(reserva.getIdioma(), "reprogramacion.rechazada.cuerpo", reserva.getTitular().getNombre(),
                            motivoLimpio != null ? ": " + motivoLimpio : "."));
        }
        return respuesta(solicitud, reserva);
    }

    private SolicitudReprogramacion buscar(UUID id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitud de reprogramacion no encontrada"));
    }

    private static SolicitudReprogramacionResponse respuesta(SolicitudReprogramacion s, Reserva reserva) {
        return SolicitudReprogramacionResponse.from(
                s, reserva.getCodigoReserva(), reserva.getTitular() != null ? reserva.getTitular().getNombre() : null,
                reserva.getCantidadPersonas());
    }
}
