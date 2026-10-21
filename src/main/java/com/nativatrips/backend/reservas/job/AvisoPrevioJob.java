package com.nativatrips.backend.reservas.job;

import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-10 (HU-05): 48 horas antes del tour el titular recibe la informacion de la salida (hora,
 * punto de encuentro, requisitos y que llevar) y el guia asignado, la lista del grupo con los
 * requerimientos especiales. Corre cada hora; cada reserva lo recibe una sola vez, aunque se
 * confirme con menos de 48 horas de anticipacion.
 */
@Component
public class AvisoPrevioJob {

    /** Dias antes del tour en que empieza la ventana del aviso. */
    static final int DIAS_DE_ANTICIPACION = 2;

    private static final Logger log = LoggerFactory.getLogger(AvisoPrevioJob.class);
    private static final DateTimeFormatter FECHA =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", Locale.forLanguageTag("es-CO"));
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final ReservaRepository reservaRepository;
    private final ReservaIntegranteRepository integranteRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionService notificacionService;
    private final Clock reloj;
    private final String urlFrontend;

    public AvisoPrevioJob(
            ReservaRepository reservaRepository,
            ReservaIntegranteRepository integranteRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            NotificacionService notificacionService,
            Clock reloj,
            @Value("${app.frontend-url:http://localhost:3000}") String urlFrontend) {
        this.reservaRepository = reservaRepository;
        this.integranteRepository = integranteRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacionService = notificacionService;
        this.reloj = reloj;
        this.urlFrontend = urlFrontend.endsWith("/") ? urlFrontend.substring(0, urlFrontend.length() - 1) : urlFrontend;
    }

    @Scheduled(cron = "${app.reservas.aviso-previo-cron:0 0 * * * *}", zone = "America/Bogota")
    @Transactional
    public void enviarAvisosPrevios() {
        LocalDate hoy = LocalDate.now(reloj);
        List<Reserva> pendientes = reservaRepository.findByEstadoAndFechaTourBetweenAndAvisoPrevioEnviadoEnIsNull(
                EstadoReserva.CONFIRMADA, hoy, hoy.plusDays(DIAS_DE_ANTICIPACION));
        for (Reserva reserva : pendientes) {
            try {
                senderoRepository.findById(reserva.getSenderoId()).ifPresent(sendero -> avisar(reserva, sendero));
                reserva.marcarAvisoPrevioEnviado(reloj.instant());
            } catch (RuntimeException ex) {
                log.error("No se pudo preparar el aviso previo de la reserva {}", reserva.getCodigoReserva(), ex);
            }
        }
        if (!pendientes.isEmpty()) {
            log.info("Avisos previos enviados: {}", pendientes.size());
        }
    }

    private void avisar(Reserva reserva, Sendero sendero) {
        String salida = FECHA.format(reserva.getFechaTour()) + " a las " + HORA.format(sendero.getFicha().horaSalida());
        String punto = sendero.getFicha().puntoEncuentro() != null ? sendero.getFicha().puntoEncuentro() : "el punto que te indique el equipo";

        if (reserva.getTitular() != null) {
            notificacionService.enviarCorreo(
                    reserva.getTitular().getCorreo(),
                    "Tu salida a " + sendero.getNombre() + " es en dos días - NativaTrips " + reserva.getCodigoReserva(),
                    "Hola " + reserva.getTitular().getNombre() + ". Te esperamos el " + salida + " en " + punto + ", "
                            + reserva.getCantidadPersonas() + " persona(s). Llega 20 minutos antes."
                            + (sendero.getRequisitosIngreso() != null ? "\n\nPara entrar: " + sendero.getRequisitosIngreso() : "")
                            + "\n\nQué llevar, cómo vestirte para el frío y cómo evitar el mal de altura:\n"
                            + urlFrontend + "/antes-de-subir"
                            + "\n\nSi algo cambia en el clima o en el sendero te escribimos. Para consultar tu reserva usa el"
                            + " enlace que te enviamos al reservar.");
        }

        if (reserva.getGuiaId() != null) {
            usuarioRepository.findById(reserva.getGuiaId()).ifPresent(guia -> notificacionService.enviarCorreo(
                    guia.getEmail(),
                    "Lista del grupo " + reserva.getCodigoReserva() + " - " + sendero.getNombre() + " " + reserva.getFechaTour(),
                    "Salida del " + salida + " en " + punto + ".\n\n" + listaDelGrupo(reserva)
                            + (reserva.getRequerimientosEspeciales() != null
                                    ? "\n\nRequerimientos especiales: " + reserva.getRequerimientosEspeciales()
                                    : "")
                            + (reserva.getTitular() != null
                                    ? "\n\nContacto del titular: +" + reserva.getTitular().getIndicativo() + " "
                                            + reserva.getTitular().getCelular()
                                    : "")));
        }
    }

    private String listaDelGrupo(Reserva reserva) {
        List<ReservaIntegrante> integrantes = integranteRepository.findByReservaId(reserva.getId());
        String nombres = integrantes.stream()
                .map(i -> "- " + i.getNombreCompleto() + " (" + i.getTipoDocumento() + " " + i.getDocumentoIdentidad() + ")")
                .collect(Collectors.joining("\n"));
        int sinRegistrar = reserva.getCantidadPersonas() - integrantes.size();
        return reserva.getCantidadPersonas() + " persona(s):\n" + nombres
                + (sinRegistrar > 0 ? "\n- " + sinRegistrar + " acompañante(s) aún sin registrar" : "");
    }
}
