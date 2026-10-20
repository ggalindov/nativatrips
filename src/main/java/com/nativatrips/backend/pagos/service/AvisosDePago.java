package com.nativatrips.backend.pagos.service;

import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Correos del pago al titular: el comprobante al aprobarse (HU-03 criterio 2) y el aviso de rechazo
 * con los intentos que le quedan (BUG-03). Como los eventos repetidos no se reaplican, cada correo
 * sale una sola vez.
 */
@Component
class AvisosDePago {

    private static final Logger log = LoggerFactory.getLogger(AvisosDePago.class);
    private static final DateTimeFormatter FECHA_Y_HORA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(RelojConfig.ZONA_OPERACION);
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm").withZone(RelojConfig.ZONA_OPERACION);

    private final NotificacionService notificacionService;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;

    AvisosDePago(
            NotificacionService notificacionService, SenderoRepository senderoRepository, UsuarioRepository usuarioRepository) {
        this.notificacionService = notificacionService;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    void comprobante(Reserva reserva, Pago pago, Instant aprobadoEn) {
        Optional<String> correo = correoDelTitular(reserva);
        if (correo.isEmpty()) {
            log.warn("La reserva {} no tiene a quien enviar el comprobante", reserva.getId());
            return;
        }
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId()).orElseThrow();
        String punto = sendero.getFicha().puntoEncuentro();
        notificacionService.enviarCorreo(
                correo.get(),
                "Comprobante de pago - NativaTrips " + identificador(reserva),
                "Tu pago fue aprobado y tu reserva quedo confirmada.\n\n"
                        + "Reserva: " + identificador(reserva) + "\n"
                        + "Sendero: " + sendero.getNombre() + "\n"
                        + "Fecha: " + reserva.getFechaTour() + ", salida a las " + sendero.getFicha().horaSalida() + "\n"
                        + (punto == null ? "" : "Punto de encuentro: " + punto + "\n")
                        + "Personas: " + reserva.getCantidadPersonas() + "\n"
                        + "Valor pagado: " + pesos(pago) + "\n"
                        + "Transaccion Wompi: " + pago.getTransactionIdPayu() + "\n"
                        + "Referencia: " + pago.getReferenciaPayu() + "\n"
                        + "Fecha del pago: " + FECHA_Y_HORA.format(aprobadoEn) + " (hora de Colombia)\n\n"
                        + "Este correo es tu comprobante. No hay reembolsos; si necesitas cambiar la fecha, solicita la"
                        + " reprogramacion desde el enlace de tu reserva.");
    }

    void rechazo(Reserva reserva, Pago pago, long intentosRestantes) {
        correoDelTitular(reserva).ifPresent(correo -> notificacionService.enviarCorreo(
                correo,
                "Tu pago no fue aprobado - NativaTrips " + identificador(reserva),
                intentosRestantes > 0
                        ? "Wompi no aprobo el pago de " + pesos(pago) + ". Puedes intentarlo de nuevo desde el enlace de tu"
                                + " reserva: te quedan " + intentosRestantes + " intento(s) y el cupo se guarda hasta las "
                                + HORA.format(reserva.getBloqueoExpiraEn()) + " (hora de Colombia)."
                        : "Wompi no aprobo el pago de " + pesos(pago) + " por tercera vez, asi que la reserva se cancelo y"
                                + " el cupo se libero. Puedes hacer una reserva nueva cuando quieras."));
    }

    private Optional<String> correoDelTitular(Reserva reserva) {
        if (reserva.getTitular() != null) {
            return Optional.of(reserva.getTitular().getCorreo());
        }
        return reserva.getTuristaId() == null
                ? Optional.empty()
                : usuarioRepository.findById(reserva.getTuristaId()).map(Usuario::getEmail);
    }

    private static String identificador(Reserva reserva) {
        return reserva.getCodigoReserva() != null ? reserva.getCodigoReserva() : reserva.getId().toString();
    }

    private static String pesos(Pago pago) {
        NumberFormat formato = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CO"));
        formato.setMaximumFractionDigits(0);
        return formato.format(pago.getMonto()) + " " + pago.getMoneda();
    }
}
