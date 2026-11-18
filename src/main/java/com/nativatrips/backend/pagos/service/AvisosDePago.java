package com.nativatrips.backend.pagos.service;

import static com.nativatrips.backend.common.correo.TextosCorreo.texto;

import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
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

    AvisosDePago(NotificacionService notificacionService, SenderoRepository senderoRepository) {
        this.notificacionService = notificacionService;
        this.senderoRepository = senderoRepository;
    }

    void comprobante(Reserva reserva, Pago pago, Instant aprobadoEn) {
        Optional<String> correo = correoDelTitular(reserva);
        if (correo.isEmpty()) {
            log.warn("La reserva {} no tiene a quien enviar el comprobante", reserva.getId());
            return;
        }
        Sendero sendero = senderoRepository.findById(reserva.getSenderoId()).orElseThrow();
        String punto = sendero.getFicha().puntoEncuentro();
        String idioma = reserva.getIdioma();
        notificacionService.enviarCorreo(
                correo.get(),
                texto(idioma, "comprobante.asunto", identificador(reserva)),
                texto(idioma, "comprobante.titulo") + "\n\n"
                        + texto(idioma, "comprobante.reserva", identificador(reserva)) + "\n"
                        + texto(idioma, "comprobante.sendero", sendero.getNombre()) + "\n"
                        + texto(idioma, "comprobante.fecha", reserva.getFechaTour(), sendero.getFicha().horaSalida()) + "\n"
                        + (punto == null ? "" : texto(idioma, "comprobante.punto", punto) + "\n")
                        + texto(idioma, "comprobante.personas", reserva.getCantidadPersonas()) + "\n"
                        + texto(idioma, "comprobante.valor", pesos(pago)) + "\n"
                        + texto(idioma, "comprobante.transaccion", pago.getTransaccionId()) + "\n"
                        + texto(idioma, "comprobante.referencia", pago.getReferencia()) + "\n"
                        + texto(idioma, "comprobante.fechaPago", FECHA_Y_HORA.format(aprobadoEn)) + "\n\n"
                        + texto(idioma, "comprobante.cierre"));
    }

    void rechazo(Reserva reserva, Pago pago, long intentosRestantes) {
        String idioma = reserva.getIdioma();
        correoDelTitular(reserva).ifPresent(correo -> notificacionService.enviarCorreo(
                correo,
                texto(idioma, "rechazo.asunto", identificador(reserva)),
                intentosRestantes > 0
                        ? texto(idioma, "rechazo.reintentar", pesos(pago), intentosRestantes,
                                HORA.format(reserva.getBloqueoExpiraEn()))
                        : texto(idioma, "rechazo.cancelada", pesos(pago))));
    }

    private Optional<String> correoDelTitular(Reserva reserva) {
        return Optional.ofNullable(reserva.getTitular()).map(TitularReserva::getCorreo);
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
