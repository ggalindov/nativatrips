package com.nativatrips.backend.capacidad.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import com.nativatrips.backend.capacidad.repository.LimiteCapacidadRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
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
class CapacidadServiceTest {

    @Mock
    private LimiteCapacidadRepository limiteCapacidadRepository;

    @Mock
    private SenderoRepository senderoRepository;

    private CapacidadService capacidadService;

    @BeforeEach
    void setUp() {
        capacidadService = new CapacidadService(limiteCapacidadRepository, senderoRepository);
    }

    @Test
    void rechazaCrearLimiteSiElSenderoNoExiste() {
        given(senderoRepository.existsById(99L)).willReturn(false);
        var request = new LimiteCapacidadRequest(LocalDate.now(), LocalDate.now().plusDays(1), 10, (short) 80, null);

        assertThatThrownBy(() -> capacidadService.crear(99L, request, UUID.randomUUID()))
                .isInstanceOf(com.nativatrips.backend.common.exception.ResourceNotFoundException.class);
        verify(limiteCapacidadRepository, never()).save(any());
    }

    @Test
    void rechazaCrearLimiteConTemporadasSolapadas() {
        Long senderoId = 1L;
        given(senderoRepository.existsById(senderoId)).willReturn(true);

        LimiteCapacidad existente = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 50, (short) 80, UUID.randomUUID(), null);
        ReflectionTestUtils.setField(existente, "id", 1L);
        given(limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId))
                .willReturn(List.of(existente));

        var solapado = new LimiteCapacidadRequest(
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 6, 1), 40, (short) 80, null);

        assertThatThrownBy(() -> capacidadService.crear(senderoId, solapado, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("solapa");
    }

    @Test
    void verificarCupoSuficienteRechazaCuandoSeExcedeElCupo() {
        Long senderoId = 1L;
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), 20, (short) 80, UUID.randomUUID(), null);
        given(limiteCapacidadRepository.findVigentePara(anyLong(), any())).willReturn(Optional.of(limite));

        assertThatThrownBy(() -> capacidadService.verificarCupoSuficiente(senderoId, LocalDate.now(), 18, 5))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("excedido");
    }

    @Test
    void verificarCupoSuficienteAceptaCuandoHayEspacio() {
        Long senderoId = 1L;
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), 20, (short) 80, UUID.randomUUID(), null);
        given(limiteCapacidadRepository.findVigentePara(anyLong(), any())).willReturn(Optional.of(limite));

        capacidadService.verificarCupoSuficiente(senderoId, LocalDate.now(), 10, 5);
    }

    @Test
    void rechazaSiNoHayLimiteConfiguradoParaLaFecha() {
        given(limiteCapacidadRepository.findVigentePara(anyLong(), any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> capacidadService.verificarCupoSuficiente(1L, LocalDate.now(), 0, 5))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("No hay un limite de capacidad configurado");
    }

    @Test
    void creaLimiteConUsuarioInternoCuandoNoSeIndicaOrigenExterno() {
        Long senderoId = 1L;
        given(senderoRepository.existsById(senderoId)).willReturn(true);
        given(limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId)).willReturn(List.of());
        given(limiteCapacidadRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));
        UUID usuarioId = UUID.randomUUID();

        var request = new LimiteCapacidadRequest(
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 30, null, null);

        var response = capacidadService.crear(senderoId, request, usuarioId);

        assertThat(response.configuradoPorUsuarioId()).isEqualTo(usuarioId);
        assertThat(response.configuradoPorExterno()).isNull();
        assertThat(response.umbralAlertaPct()).isEqualTo((short) 80);
    }

    @Test
    void creaLimiteConOrigenExternoCuandoSeIndicaEnLaSolicitud() {
        Long senderoId = 1L;
        given(senderoRepository.existsById(senderoId)).willReturn(true);
        given(limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId)).willReturn(List.of());
        given(limiteCapacidadRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        var request = new LimiteCapacidadRequest(
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 30, (short) 90, "Autoridad Ambiental - CAR");

        var response = capacidadService.crear(senderoId, request, UUID.randomUUID());

        assertThat(response.configuradoPorUsuarioId()).isNull();
        assertThat(response.configuradoPorExterno()).isEqualTo("Autoridad Ambiental - CAR");
        assertThat(response.umbralAlertaPct()).isEqualTo((short) 90);
    }

    @Test
    void rechazaCrearLimiteConFechaFinAnteriorAFechaInicio() {
        given(senderoRepository.existsById(1L)).willReturn(true);
        var request = new LimiteCapacidadRequest(LocalDate.of(2026, 3, 1), LocalDate.of(2026, 1, 1), 10, (short) 80, null);

        assertThatThrownBy(() -> capacidadService.crear(1L, request, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("temporada");
    }

    @Test
    void actualizarLanzaResourceNotFoundSiElLimiteNoExiste() {
        given(limiteCapacidadRepository.findById(1L)).willReturn(Optional.empty());
        var request = new LimiteCapacidadRequest(LocalDate.now(), LocalDate.now().plusDays(1), 10, (short) 80, null);

        assertThatThrownBy(() -> capacidadService.actualizar(1L, request))
                .isInstanceOf(com.nativatrips.backend.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void actualizarModificaLosCamposDelLimiteExistente() {
        Long senderoId = 1L;
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 30, (short) 80, UUID.randomUUID(), null);
        ReflectionTestUtils.setField(limite, "id", 5L);
        given(limiteCapacidadRepository.findById(5L)).willReturn(Optional.of(limite));
        given(limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId)).willReturn(List.of(limite));

        var request = new LimiteCapacidadRequest(
                LocalDate.of(2026, 4, 1), LocalDate.of(2026, 6, 30), 45, (short) 75, null);

        var response = capacidadService.actualizar(5L, request);

        assertThat(response.cupoMaximoDia()).isEqualTo(45);
        assertThat(response.umbralAlertaPct()).isEqualTo((short) 75);
        assertThat(response.temporadaInicio()).isEqualTo(LocalDate.of(2026, 4, 1));
    }

    @Test
    void listarPorSenderoDelegaEnElRepositorio() {
        Long senderoId = 1L;
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), 30, (short) 80, UUID.randomUUID(), null);
        given(limiteCapacidadRepository.findBySenderoIdOrderByTemporadaInicio(senderoId)).willReturn(List.of(limite));

        var resultado = capacidadService.listarPorSendero(senderoId);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).senderoId()).isEqualTo(senderoId);
    }

    @Test
    void calculaDisponibilidadYUmbralDeAlerta() {
        Long senderoId = 1L;
        LimiteCapacidad limite = new LimiteCapacidad(
                senderoId, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31), 20, (short) 80, UUID.randomUUID(), null);
        given(limiteCapacidadRepository.findVigentePara(anyLong(), any())).willReturn(Optional.of(limite));

        var disponibilidad = capacidadService.verificarDisponibilidad(senderoId, LocalDate.now(), 17);

        assertThat(disponibilidad.cupoDisponible()).isEqualTo(3);
        assertThat(disponibilidad.umbralAlertaSuperado()).isTrue();
    }
}
