package com.nativatrips.backend.pagos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/** HU-03 criterio 2 y BUG-03: el titular recibe el comprobante o el aviso de rechazo con los intentos que le quedan. */
@ExtendWith(MockitoExtension.class)
class AvisosDePagoTest {

    @Mock
    private NotificacionService notificacionService;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private AvisosDePago avisos;
    private Reserva reserva;
    private Pago pago;

    @BeforeEach
    void setUp() {
        avisos = new AvisosDePago(notificacionService, senderoRepository, usuarioRepository);
        reserva = Reserva.sinCuenta(1L, LocalDate.of(2026, 10, 24), 3, Instant.parse("2026-10-20T15:15:00Z"), "NT-7Q4KX2",
                new TitularReserva("Laura Gomez", TipoDocumento.CC, "1020304050", "CO", "laura@example.com", "57", "3001234567"));
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
        pago = new Pago(reserva.getId(), "NT-7Q4KX2-ABCD1234", new BigDecimal("135000"), "COP");
        pago.setTransactionIdPayu("1234-1610641025-49201");
    }

    @Test
    void elComprobanteTraeLaReservaElValorYLaTransaccion() {
        Sendero sendero = new Sendero("Lagunas de Siecha", null, NivelDificultad.MODERADO, 240, "ECOTURISMO", null, new BigDecimal("45000"));
        given(senderoRepository.findById(1L)).willReturn(Optional.of(sendero));

        avisos.comprobante(reserva, pago, Instant.parse("2026-10-20T15:05:00Z"));

        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq("laura@example.com"), eq("Comprobante de pago - NativaTrips NT-7Q4KX2"), cuerpo.capture());
        assertThat(cuerpo.getValue())
                .contains("Lagunas de Siecha")
                .contains("2026-10-24")
                .contains("Personas: 3")
                .contains("135.000")
                .contains("1234-1610641025-49201")
                .contains("2026-10-20 10:05 (hora de Colombia)");
    }

    @Test
    void elAvisoDeRechazoDiceCuantosIntentosQuedanYHastaCuandoSeGuardaElCupo() {
        avisos.rechazo(reserva, pago, 2);

        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq("laura@example.com"), anyString(), cuerpo.capture());
        assertThat(cuerpo.getValue()).contains("te quedan 2 intento(s)").contains("10:15 (hora de Colombia)");
    }

    @Test
    void alTercerRechazoElAvisoDiceQueLaReservaSeCancelo() {
        avisos.rechazo(reserva, pago, 0);

        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq("laura@example.com"), anyString(), cuerpo.capture());
        assertThat(cuerpo.getValue()).contains("se cancelo").contains("cupo se libero");
    }
}
