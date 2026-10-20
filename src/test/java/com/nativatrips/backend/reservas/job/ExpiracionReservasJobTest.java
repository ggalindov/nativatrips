package com.nativatrips.backend.reservas.job;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.ConciliacionPago;
import com.nativatrips.backend.reservas.service.ReservaService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExpiracionReservasJobTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private ReservaService reservaService;

    @Mock
    private ConciliacionPago conciliacion;

    private ExpiracionReservasJob job;

    @BeforeEach
    void setUp() {
        job = new ExpiracionReservasJob(reservaRepository, reservaService, conciliacion);
        org.mockito.Mockito.lenient().when(conciliacion.conciliar(any())).thenReturn(ConciliacionPago.Resultado.SIN_PAGO);
        org.mockito.Mockito.lenient().when(reservaRepository.findById(any()))
                .thenAnswer(inv -> Optional.of(pendiente(inv.getArgument(0))));
    }

    @Test
    void noHaceNadaSiNoHayReservasVencidas() {
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of());

        job.expirarReservasVencidas();

        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void transicionaATodasLasReservasVencidasAExpirada() {
        Reserva r1 = unaReserva();
        Reserva r2 = unaReserva();
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of(r1, r2));

        job.expirarReservasVencidas();

        verify(reservaService, times(2))
                .transicionarEstado(any(), eq(EstadoReserva.EXPIRADA), any(), any(), eq(null));
    }

    @Test
    void continuaConLasDemasReservasSiUnaFalla() {
        Reserva r1 = unaReserva();
        Reserva r2 = unaReserva();
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of(r1, r2));
        given(reservaService.transicionarEstado(eq(r1.getId()), any(), any(), any(), any()))
                .willThrow(new RuntimeException("fallo simulado"));

        job.expirarReservasVencidas();

        verify(reservaService).transicionarEstado(eq(r2.getId()), any(), any(), any(), any());
    }

    private static Reserva unaReserva() {
        Reserva reserva = new Reserva(
                1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, Instant.now().minusSeconds(60));
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
        return reserva;
    }

    @Test
    void siWompiConfirmaElPagoLaReservaNoSeExpira() {
        Reserva reserva = unaReserva();
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of(reserva));
        given(conciliacion.conciliar(reserva.getId())).willReturn(ConciliacionPago.Resultado.PAGADA);

        job.expirarReservasVencidas();

        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void sinRespuestaDeWompiSeEsperaHastaTreintaMinutosDespuesDelVencimiento() {
        Reserva reciente = unaReserva();
        Reserva antigua = unaReserva();
        antigua.setBloqueoExpiraEn(Instant.now().minus(ExpiracionReservasJob.ESPERA_MAXIMA_CONCILIACION).minusSeconds(60));
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of(reciente, antigua));
        given(conciliacion.conciliar(any())).willReturn(ConciliacionPago.Resultado.SIN_RESPUESTA);

        job.expirarReservasVencidas();

        verify(reservaService, never()).transicionarEstado(eq(reciente.getId()), any(), any(), any(), any());
        verify(reservaService).transicionarEstado(eq(antigua.getId()), eq(EstadoReserva.EXPIRADA), any(), any(), eq(null));
    }

    @Test
    void siLaConciliacionLaCancelaPorTercerRechazoNoSeExpira() {
        Reserva reserva = unaReserva();
        given(reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(eq(EstadoReserva.PENDIENTE_PAGO), any()))
                .willReturn(List.of(reserva));
        Reserva cancelada = unaReserva();
        cancelada.setEstado(EstadoReserva.CANCELADA);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(cancelada));

        job.expirarReservasVencidas();

        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    private static Reserva pendiente(UUID id) {
        Reserva reserva = unaReserva();
        ReflectionTestUtils.setField(reserva, "id", id);
        return reserva;
    }
}
