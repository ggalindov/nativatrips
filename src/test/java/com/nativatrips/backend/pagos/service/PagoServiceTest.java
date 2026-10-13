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
import com.nativatrips.backend.config.PayuProperties;
import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.repository.PagoEstadoHistorialRepository;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
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
    private ReservaRepository reservaRepository;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private ReservaService reservaService;

    @Mock
    private PayuSignatureService signatureService;

    private PagoService pagoService;
    private PayuProperties payuProperties;

    @BeforeEach
    void setUp() {
        payuProperties = new PayuProperties();
        payuProperties.setApiKey("4Vj8eK4rloUd272L48hsrarnUA");
        payuProperties.setMerchantId("508029");
        payuProperties.setAccountId("512321");
        payuProperties.setCurrency("COP");
        payuProperties.setTestMode(true);
        payuProperties.setCheckoutUrlSandbox("https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/");
        payuProperties.setResponseUrl("http://localhost:3000/pagos/respuesta");
        payuProperties.setConfirmationUrl("http://localhost:8080/api/v1/pagos/confirmacion");

        pagoService = new PagoService(
                pagoRepository, historialRepository, reservaRepository, senderoRepository,
                reservaService, signatureService, payuProperties);
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
        given(signatureService.generarFirmaSolicitud(anyString(), any(), anyString())).willReturn("firma-simulada");
        given(signatureService.formatearMonto(any())).willReturn("150000.0");

        var response = pagoService.iniciarPago(reservaId, turistaId, "turista@example.com");

        assertThat(response.amount()).isEqualTo("150000.0");
        assertThat(response.merchantId()).isEqualTo("508029");
        assertThat(response.signature()).isEqualTo("firma-simulada");
        assertThat(response.checkoutUrl()).isEqualTo("https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/");
        assertThat(response.test()).isEqualTo("1");
        verify(historialRepository).save(any());
    }

    @Test
    void procesarConfirmacionRechazaFirmaInvalida() {
        given(signatureService.validarFirmaConfirmacion(anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(false);

        var payload = new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", "4", "firma-mala", "TX-1", "{}");

        assertThatThrownBy(() -> pagoService.procesarConfirmacion(payload))
                .isInstanceOf(BusinessRuleException.class);
        verify(pagoRepository, never()).findByReferenciaPayu(any());
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void procesarConfirmacionRechazaMontoQueNoCoincide() {
        given(signatureService.validarFirmaConfirmacion(anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(true);
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaPayu("REF-1")).willReturn(Optional.of(pago));

        var payload = new ConfirmacionPayuPayload("REF-1", "999999.0", "COP", "4", "firma", "TX-1", "{}");

        assertThatThrownBy(() -> pagoService.procesarConfirmacion(payload))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("monto");
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }

    @Test
    void procesarConfirmacionAprobadaConfirmaLaReserva() {
        given(signatureService.validarFirmaConfirmacion(anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(true);
        UUID reservaId = UUID.randomUUID();
        Pago pago = new Pago(reservaId, "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaPayu("REF-1")).willReturn(Optional.of(pago));

        var payload = new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", "4", "firma", "TX-1", "{}");

        pagoService.procesarConfirmacion(payload);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.APROBADO);
        verify(reservaService).transicionarEstado(
                org.mockito.ArgumentMatchers.eq(reservaId),
                org.mockito.ArgumentMatchers.eq(EstadoReserva.CONFIRMADA),
                anyString(),
                any(),
                org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void procesarConfirmacionRechazadaCancelaLaReserva() {
        given(signatureService.validarFirmaConfirmacion(anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(true);
        UUID reservaId = UUID.randomUUID();
        Pago pago = new Pago(reservaId, "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaPayu("REF-1")).willReturn(Optional.of(pago));

        var payload = new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", "6", "firma", "TX-1", "{}");

        pagoService.procesarConfirmacion(payload);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.RECHAZADO);
        verify(reservaService).transicionarEstado(
                org.mockito.ArgumentMatchers.eq(reservaId),
                org.mockito.ArgumentMatchers.eq(EstadoReserva.CANCELADA),
                anyString(),
                any(),
                org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void procesarConfirmacionPendienteNoModificaLaReserva() {
        given(signatureService.validarFirmaConfirmacion(anyString(), anyString(), anyString(), anyString(), anyString()))
                .willReturn(true);
        Pago pago = new Pago(UUID.randomUUID(), "REF-1", new BigDecimal("50000.0"), "COP");
        given(pagoRepository.findByReferenciaPayu("REF-1")).willReturn(Optional.of(pago));

        var payload = new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", "7", "firma", "TX-1", "{}");

        pagoService.procesarConfirmacion(payload);

        assertThat(pago.getEstado()).isEqualTo(EstadoPago.PENDIENTE);
        verify(reservaService, never()).transicionarEstado(any(), any(), any(), any(), any());
    }
}
