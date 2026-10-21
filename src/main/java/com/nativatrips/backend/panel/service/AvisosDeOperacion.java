package com.nativatrips.backend.panel.service;

import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

/**
 * Avisos al equipo sobre la operacion del dia: cada reserva nueva o que cambia de estado llega en
 * vivo al panel (RF-08) y, cuando una reserva hace cruzar el umbral de aforo del dia, el equipo
 * recibe la alerta por correo y en el panel (RF-26).
 */
@Component
public class AvisosDeOperacion {

    public record ReservaEnPanel(
            String codigo, EstadoReserva estado, Long senderoId, String senderoNombre, LocalDate fecha, int personas,
            TipoGrupo tipoGrupo, String titular) {
    }

    public record AlertaAforo(
            Long senderoId, String senderoNombre, LocalDate fecha, int ocupacion, int cupoMaximo, int porcentaje,
            int umbral) {
    }

    private final EventosPanel eventosPanel;
    private final NotificacionService notificacionService;
    private final UsuarioRepository usuarioRepository;

    public AvisosDeOperacion(
            EventosPanel eventosPanel, NotificacionService notificacionService, UsuarioRepository usuarioRepository) {
        this.eventosPanel = eventosPanel;
        this.notificacionService = notificacionService;
        this.usuarioRepository = usuarioRepository;
    }

    public void reserva(Reserva reserva, Sendero sendero) {
        eventosPanel.publicar("reserva", new ReservaEnPanel(
                reserva.getCodigoReserva(), reserva.getEstado(), sendero.getId(), sendero.getNombre(),
                reserva.getFechaTour(), reserva.getCantidadPersonas(), reserva.getTipoGrupo(),
                reserva.getTitular() != null ? reserva.getTitular().getNombre() : null));
    }

    /** Avisa solo cuando la reserva hace cruzar el umbral, no en cada reserva posterior del mismo dia. */
    public void siCruzaElUmbral(CapacidadDia dia, Sendero sendero, int ocupacionAntes, int ocupacionDespues) {
        if (dia.umbralSuperadoCon(ocupacionAntes) || !dia.umbralSuperadoCon(ocupacionDespues)) {
            return;
        }
        int porcentaje = (int) Math.round(ocupacionDespues * 100.0 / dia.getCupoMaximo());
        AlertaAforo alerta = new AlertaAforo(
                sendero.getId(), sendero.getNombre(), dia.getFecha(), ocupacionDespues, dia.getCupoMaximo(), porcentaje,
                dia.getUmbralAlertaPct());
        eventosPanel.publicar("aforo", alerta);

        String asunto = "Aforo al " + porcentaje + " % - " + sendero.getNombre() + " " + dia.getFecha();
        String cuerpo = sendero.getNombre() + " ya tiene " + ocupacionDespues + " de " + dia.getCupoMaximo()
                + " cupos ocupados para el " + dia.getFecha() + " (" + porcentaje + " %), por encima del umbral del "
                + dia.getUmbralAlertaPct() + " %.\n\nRevisa si hace falta otro guía o ajustar la capacidad del día"
                + " desde el panel.";
        for (Usuario admin : usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR)) {
            notificacionService.enviarCorreo(admin.getEmail(), asunto, cuerpo);
        }
    }
}
