package com.nativatrips.backend.pagos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.pagos.pasarela.ClienteWompi;
import com.nativatrips.backend.pagos.pasarela.ResultadoPago;
import com.nativatrips.backend.pagos.repository.PagoRepository;
import com.nativatrips.backend.reservas.service.ConciliacionPago.Resultado;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;

/** HU-03 criterio 5: antes de liberar el cupo se pregunta a Wompi por si el evento se perdio. */
@ExtendWith(MockitoExtension.class)
class ConciliacionWompiTest {

    private static final UUID RESERVA = UUID.randomUUID();

    @Mock
    private PagoRepository pagoRepository;

    @Mock
    private PagoService pagoService;

    @Mock
    private ClienteWompi clienteWompi;

    private ConciliacionWompi conciliacion;
    private final Pago pendiente = new Pago(RESERVA, "NT-7Q4KX2-ABC", new BigDecimal("44900"), "COP");

    @BeforeEach
    void setUp() {
        conciliacion = new ConciliacionWompi(pagoRepository, pagoService, clienteWompi);
    }

    @Test
    void sinPagosPendientesSePuedeLiberar() {
        given(pagoRepository.findByReservaIdOrderByCreatedAtDesc(RESERVA)).willReturn(List.of());

        assertThat(conciliacion.conciliar(RESERVA)).isEqualTo(Resultado.SIN_PAGO);
    }

    @Test
    void unPagoAprobadoQueNoLlegoPorEventoSeAplicaYNoSeLibera() {
        given(pagoRepository.findByReservaIdOrderByCreatedAtDesc(RESERVA)).willReturn(List.of(pendiente));
        given(clienteWompi.puedeConsultar()).willReturn(true);
        given(clienteWompi.transaccionesPorReferencia("NT-7Q4KX2-ABC")).willReturn(List.of(
                new ClienteWompi.Transaccion("TX-1", "NT-7Q4KX2-ABC", "APPROVED", new BigDecimal("44900"), "COP", "{}")));

        assertThat(conciliacion.conciliar(RESERVA)).isEqualTo(Resultado.PAGADA);
        ArgumentCaptor<ResultadoPago> aplicado = ArgumentCaptor.forClass(ResultadoPago.class);
        verify(pagoService).aplicarResultado(aplicado.capture());
        assertThat(aplicado.getValue().estado()).isEqualTo(EstadoPago.APROBADO);
        assertThat(aplicado.getValue().transaccionId()).isEqualTo("TX-1");
    }

    @Test
    void unaTransaccionEnProcesoOWompiCaidoPidenEsperar() {
        given(pagoRepository.findByReservaIdOrderByCreatedAtDesc(RESERVA)).willReturn(List.of(pendiente));
        given(clienteWompi.puedeConsultar()).willReturn(true);
        given(clienteWompi.transaccionesPorReferencia("NT-7Q4KX2-ABC"))
                .willReturn(List.of(new ClienteWompi.Transaccion(
                        "TX-1", "NT-7Q4KX2-ABC", "PENDING", new BigDecimal("44900"), "COP", "{}")))
                .willThrow(new ResourceAccessException("sin conexion"));

        assertThat(conciliacion.conciliar(RESERVA)).isEqualTo(Resultado.SIN_RESPUESTA);
        assertThat(conciliacion.conciliar(RESERVA)).isEqualTo(Resultado.SIN_RESPUESTA);
        verify(pagoService, never()).aplicarResultado(any());
    }

    @Test
    void sinTransaccionesEnWompiSeLibera() {
        given(pagoRepository.findByReservaIdOrderByCreatedAtDesc(RESERVA)).willReturn(List.of(pendiente));
        given(clienteWompi.puedeConsultar()).willReturn(true);
        given(clienteWompi.transaccionesPorReferencia("NT-7Q4KX2-ABC")).willReturn(List.of());

        assertThat(conciliacion.conciliar(RESERVA)).isEqualTo(Resultado.SIN_PAGO);
    }
}
