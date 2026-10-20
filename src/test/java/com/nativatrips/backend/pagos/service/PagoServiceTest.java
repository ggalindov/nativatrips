package com.nativatrips.backend.pagos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.pasarela.CheckoutPago;
import com.nativatrips.backend.pagos.pasarela.PasarelaPago;
import com.nativatrips.backend.pagos.pasarela.ResultadoPago;
import com.nativatrips.backend.pagos.repository.EventoPagoRepository;
import com.nativatrips.backend.pagos.repository.PagoEstadoHistorialRepository;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.reservas.service.EnlaceReservaService;
import com.nativatrips.backend.reservas.service.ReservaService;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
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

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private PagoEstadoHistorialRepository historialRepository;

    @Mock
    private EventoPagoRepository eventoRepository;

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private ReservaService reservaService;

    @Mock
    private PasarelaPago pasarela;

    @Mock
    private EnlaceReservaService enlaceService;

    private PagoService pagoService;

    @BeforeEach
    void setUp() {
        pagoService = new PagoService(
                pagoRepository, historialRepository, eventoRepository, reservaRepository, senderoRepository,
                reservaService, pasarela, new WompiProperties(), enlaceService);
    }

    @Test
    void iniciarPagoRechazaSiLaReservaNoEstaPendienteDePago() {
        UUID turistaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, turistaId, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> pagoService.iniciarPago(reservaId, turistaId, "turista@example.com"))
                .isInstanceOf(BusinessRuleException.class);
        verify(pagoRepository, never()).save(any());
    }

    @Test
    void iniciarPagoRechazaSiElBloqueoTemporalYaVencio() {
        UUID turistaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, turistaId, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR,
                Instant.now().minusSeconds(60));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> pagoService.iniciarPago(reservaId, turistaId, "turista@example.com"))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void iniciarPagoRechazaReservaDeOtroUsuario() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR,
                Instant.now().plusSeconds(900));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> pagoService.iniciarPago(reservaId, UUID.randomUUID(), "otro@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void iniciarPagoCreaUnPagoNuevoYCalculaElMontoDesdeElSendero() {
        UUID turistaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, turistaId, LocalDate.now().plusDays(1), 3, TipoGrupo.ESTANDAR,
                Instant.now().plusSeconds(900));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));
        given(pagoRepository.findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(reservaId, EstadoPago.PENDIENTE))
                .willReturn(Optional.empty());

        Sendero sendero = new Sendero(
                "Sendero", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("50000"));
        ReflectionTestUtils.setField(sendero, "id", 1L);
        given(senderoRepository.findById(1L)).willReturn(Optional.of(sendero));

        given(pagoRepository.save(any())).willAnswer(invocation -> {
            Pago pago = invocation.getArgument(0);
            ReflectionTestUtils.setField(pago, "id", UUID.randomUUID());
            return pago;
        });
        CheckoutPago checkout = new CheckoutPago() { };
        given(pasarela.prepararCheckout(any(), any(), anyString())).willReturn(checkout);

        CheckoutPago response = pagoService.iniciarPago(reservaId, turistaId, "turista@example.com");

        assertThat(response).isSameAs(checkout);
        ArgumentCaptor<Pago> pago = ArgumentCaptor.forClass(Pago.class);
        verify(pasarela).prepararCheckout(pago.capture(), org.mockito.ArgumentMatchers.eq(reserva.getBloqueoExpiraEn()), org.mockito.ArgumentMatchers.eq("turista@example.com"));
        assertThat(pago.getValue().getMoneda()).isEqualTo("COP");
        assertThat(pago.getValue().getMonto()).isEqualByComparingTo("150000");
        verify(historialRepository).save(any());
    }

    @Test
    void aplicarResultadoRechazaMontoQueNoCoincide() {
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        var resultado = new ResultadoPago("REF-1", "TX-1", EstadoPago.APROBADO, new BigDecimal("999999.0"), "COP", "detalle", "{}");

        assertThatThrownBy(() -> pagoService.aplicarResultado(resultado))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("monto");
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void aplicarResultadoAprobadaConfirmaLaReserva() {
        UUID reservaId = UUID.randomUUID();
        Pago pago = new Pago(reservaId, "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        var resultado = new ResultadoPago("REF-1", "TX-1", EstadoPago.APROBADO, new BigDecimal("50000.0"), "COP", "detalle", "{}");

        pagoService.aplicarResultado(resultado);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.APROBADO);
        verify(reservaService).transicionarEstado(
                org.mockito.ArgumentMatchers.eq(reservaId),
                org.mockito.ArgumentMatchers.eq(EstadoReserva.CONFIRMADA),
                anyString(),
                any(),
                org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void aplicarResultadoRechazadaCancelaLaReserva() {
        UUID reservaId = UUID.randomUUID();
        Pago pago = new Pago(reservaId, "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        var resultado = new ResultadoPago("REF-1", "TX-1", EstadoPago.RECHAZADO, new BigDecimal("50000.0"), "COP", "detalle", "{}");

        pagoService.aplicarResultado(resultado);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.RECHAZADO);
        verify(reservaService).transicionarEstado(
                org.mockito.ArgumentMatchers.eq(reservaId),
                org.mockito.ArgumentMatchers.eq(EstadoReserva.CANCELADA),
                anyString(),
                any(),
                org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void aplicarResultadoRechazaUnaMonedaDistintaALaDelPago() {
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        var resultado = new ResultadoPago("REF-1", "TX-1", EstadoPago.APROBADO, new BigDecimal("50000.0"), "USD", "detalle", "{}");

        assertThatThrownBy(() -> pagoService.aplicarResultado(resultado)).isInstanceOf(BusinessRuleException.class);
        assertThat(pago.getEstado()).isEqualTo(EstadoPago.PENDIENTE);
    }

    @Test
    void aplicarResultadoPendienteNoModificaLaReserva() {
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        var resultado = new ResultadoPago("REF-1", "TX-1", EstadoPago.PENDIENTE, new BigDecimal("50000.0"), "COP", "detalle", "{}");

        pagoService.aplicarResultado(resultado);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.PENDIENTE);
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void unEventoRepetidoNoSeVuelveAAplicar() {
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));
        given(eventoRepository.existsByTransaccionIdAndEstado("TX-1", EstadoPago.APROBADO)).willReturn(true);

        pagoService.aplicarResultado(new ResultadoPago("REF-1", "TX-1", EstadoPago.APROBADO, new BigDecimal("50000.0"), "COP", "detalle", "{}"));

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.PENDIENTE);
        verify(historialRepository, never()).save(any());
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void unPagoAprobadoNoSeReabreConUnEventoPosterior() {
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        pago.setEstado(EstadoPago.APROBADO);
        given(pagoRepository.findByReferenciaConBloqueo("REF-1")).willReturn(Optional.of(pago));

        pagoService.aplicarResultado(new ResultadoPago("REF-1", "TX-1", EstadoPago.RECHAZADO, new BigDecimal("50000.0"), "COP", "detalle", "{}"));

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.APROBADO);
        verify(eventoRepository).save(any());
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }
}
