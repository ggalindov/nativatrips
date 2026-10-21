package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.dto.AcompananteRequest;
import com.nativatrips.backend.reservas.dto.MiReservaResponse;
import com.nativatrips.backend.reservas.dto.PersonaResponse;
import com.nativatrips.backend.reservas.dto.TitularResponse;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** HU-18 (NAT-112): el titular consulta y completa su reserva desde el enlace magico, sin cuenta. */
@Service
public class MiReservaService {

    private static final List<EstadoReserva> ESTADOS_QUE_ADMITEN_ACOMPANANTES =
            List.of(EstadoReserva.PENDIENTE_PAGO, EstadoReserva.EN_REVISION, EstadoReserva.CONFIRMADA);

    private final EnlaceReservaService enlaceService;
    private final ReservaRepository reservaRepository;
    private final ReservaIntegranteRepository integranteRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;

    public MiReservaService(
            EnlaceReservaService enlaceService,
            ReservaRepository reservaRepository,
            ReservaIntegranteRepository integranteRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            NotificacionService notificacionService) {
        this.enlaceService = enlaceService;
        this.reservaRepository = reservaRepository;
        this.integranteRepository = integranteRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
    }

    @Transactional(noRollbackFor = BusinessRuleException.class)
    public MiReservaResponse consultar(String token, String ip) {
        return respuesta(enlaceService.abrir(token, "CONSULTAR", ip));
    }

    /** Registra un acompanante que falto al reservar; nunca mas de las personas reservadas. */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public MiReservaResponse agregarAcompanante(String token, AcompananteRequest acompanante, String ip) {
        Reserva reserva = enlaceService.abrir(token, "AGREGAR_ACOMPANANTE", ip);
        if (!ESTADOS_QUE_ADMITEN_ACOMPANANTES.contains(reserva.getEstado())) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "La reserva ya no admite cambios (estado " + reserva.getEstado() + ")");
        }
        ReglasPersona.validarDocumento(acompanante.tipoDocumento(), acompanante.documento(), acompanante.nacionalidad());
        if (integranteRepository.findByReservaId(reserva.getId()).size() >= reserva.getCantidadPersonas()) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Ya estan registradas las " + reserva.getCantidadPersonas() + " personas de la reserva");
        }

        integranteRepository.save(new ReservaIntegrante(
                reserva.getId(), acompanante.nombre().trim(), acompanante.tipoDocumento(), acompanante.documento().trim(),
                acompanante.nacionalidad()));
        return respuesta(reserva);
    }

    /**
     * HU-18 criterio 3: si el codigo y el correo coinciden llega un enlace nuevo y el anterior deja
     * de servir. La respuesta es la misma en todos los casos, para no revelar que reservas existen.
     */
    @Transactional
    public void solicitarEnlace(String codigo, String correo) {
        reservaRepository.findByCodigoReserva(codigo.trim().toUpperCase(Locale.ROOT))
                .filter(r -> r.getTitular() != null && r.getTitular().getCorreo().equalsIgnoreCase(correo.trim()))
                .ifPresent(reserva -> {
                    EnlaceReservaService.EnlaceEmitido enlace = enlaceService.emitir(reserva);
                    notificacionService.enviarCorreo(
                            reserva.getTitular().getCorreo(),
                            "Tu nuevo enlace de reserva - NativaTrips " + reserva.getCodigoReserva(),
                            "Hola " + reserva.getTitular().getNombre() + ". Este es el nuevo enlace de tu reserva "
                                    + reserva.getCodigoReserva() + "; el anterior ya no funciona:\n\n" + enlace.url()
                                    + "\n\nSi no lo pediste, no hagas nada: solo quien tenga tu correo puede usarlo.");
                });
    }

    private MiReservaResponse respuesta(Reserva reserva) {
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId()).orElseThrow();
        TitularReserva titular = reserva.getTitular();
        List<PersonaResponse> acompanantes = integranteRepository.findByReservaId(reserva.getId()).stream()
                .filter(i -> !esElTitular(i, titular))
                .map(PersonaResponse::from)
                .toList();
        String guia = reserva.getGuiaId() == null
                ? null
                : usuarioRepository.findById(reserva.getGuiaId()).map(Usuario::getNombreCompleto).orElse(null);

        return new MiReservaResponse(
                reserva.getCodigoReserva(),
                sendero.getId(),
                sendero.getNombre(),
                reserva.getFechaTour(),
                sendero.getFicha().horaSalida(),
                reserva.getCantidadPersonas(),
                titular == null ? null : TitularResponse.from(titular),
                acompanantes,
                reserva.getEstado(),
                reserva.getBloqueoExpiraEn(),
                guia,
                sendero.getFicha().puntoEncuentro());
    }

    private static boolean esElTitular(ReservaIntegrante integrante, TitularReserva titular) {
        return titular != null
                && titular.getDocumento().equals(integrante.getDocumentoIdentidad())
                && titular.getTipoDocumento() == integrante.getTipoDocumento();
    }
}
