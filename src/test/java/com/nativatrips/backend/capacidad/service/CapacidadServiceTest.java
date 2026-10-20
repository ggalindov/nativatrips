package com.nativatrips.backend.capacidad.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaRequest;
import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.LimiteCapacidadRequest;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.capacidad.repository.LimiteCapacidadRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.RelojConfig;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.Clock;
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
    private CapacidadDiaRepository capacidadDiaRepository;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private OcupacionDelDia ocupacionDelDia;

    /** Martes 20 de octubre de 2026 en Bogota. */
    private static final LocalDate HOY = LocalDate.of(2026, 10, 20);

    private CapacidadService capacidadService;

    @BeforeEach
    void setUp() {
        Clock reloj = Clock.fixed(HOY.atTime(9, 0).atZone(RelojConfig.ZONA_OPERACION).toInstant(), RelojConfig.ZONA_OPERACION);
        capacidadService = new CapacidadService(
                limiteCapacidadRepository, capacidadDiaRepository, senderoRepository, ocupacionDelDia, reloj);
    }

    @Test
    void cargarDiasCreaLosDiasNuevosConElUmbralPorDefectoYQuienLosCargo() {
        UUID admin = UUID.randomUUID();
        given(senderoRepository.existsById(1L)).willReturn(true);
        given(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(any(), any())).willReturn(Optional.empty());
        given(capacidadDiaRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        List<CapacidadDiaResponse> cargados = capacidadService.cargarDias(
                1L,
                List.of(new CapacidadDiaRequest(HOY.plusDays(2), 30, null), new CapacidadDiaRequest(HOY.plusDays(1), 25, (short) 90)),
                admin);

        assertThat(cargados).extracting(CapacidadDiaResponse::fecha).containsExactly(HOY.plusDays(1), HOY.plusDays(2));
        assertThat(cargados.get(1).umbralAlertaPct()).isEqualTo((short) 80);
        assertThat(cargados).allSatisfy(dia -> assertThat(dia.cargadoPorUsuarioId()).isEqualTo(admin));
    }

    @Test
    void cargarDiasActualizaElDiaExistenteYDejaAlUltimoAdministradorComoResponsable() {
        UUID admin = UUID.randomUUID();
        CapacidadDia existente = new CapacidadDia(1L, HOY.plusDays(3), 20, (short) 80, UUID.randomUUID());
        given(senderoRepository.existsById(1L)).willReturn(true);
        given(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(1L, HOY.plusDays(3))).willReturn(Optional.of(existente));
        given(ocupacionDelDia.personasReservadas(1L, HOY.plusDays(3))).willReturn(12);

        CapacidadDiaResponse dia = capacidadService
                .cargarDias(1L, List.of(new CapacidadDiaRequest(HOY.plusDays(3), 15, null)), admin)
                .getFirst();

        assertThat(dia.cupoMaximo()).isEqualTo(15);
        assertThat(dia.ocupacion()).isEqualTo(12);
        assertThat(dia.cupoDisponible()).isEqualTo(3);
        assertThat(dia.umbralAlertaSuperado()).isTrue();
        assertThat(existente.getCargadoPorUsuarioId()).isEqualTo(admin);
        verify(capacidadDiaRepository, never()).save(any());
    }

    @Test
    void cargarDiasRechazaUnCupoPorDebajoDeLoYaReservado() {
        given(senderoRepository.existsById(1L)).willReturn(true);
        given(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(any(), any())).willReturn(Optional.empty());
        given(ocupacionDelDia.personasReservadas(1L, HOY.plusDays(1))).willReturn(18);

        assertThatThrownBy(() -> capacidadService.cargarDias(
                        1L, List.of(new CapacidadDiaRequest(HOY.plusDays(1), 10, null)), UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("18 personas ya reservadas");
        verify(capacidadDiaRepository, never()).save(any());
    }

    @Test
    void cargarDiasRechazaFechasPasadas() {
        given(senderoRepository.existsById(1L)).willReturn(true);

        assertThatThrownBy(() -> capacidadService.cargarDias(
                        1L, List.of(new CapacidadDiaRequest(HOY.minusDays(1), 10, null)), UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("fecha pasada");
    }

    @Test
    void cargarDiasRechazaDiasRepetidosEnLaMismaCarga() {
        given(senderoRepository.existsById(1L)).willReturn(true);

        assertThatThrownBy(() -> capacidadService.cargarDias(
                        1L,
                        List.of(new CapacidadDiaRequest(HOY.plusDays(1), 10, null), new CapacidadDiaRequest(HOY.plusDays(1), 12, null)),
                        UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("repetido");
    }

    @Test
    void cargarDiasRechazaSiElSenderoNoExiste() {
        given(senderoRepository.existsById(9L)).willReturn(false);

        assertThatThrownBy(() -> capacidadService.cargarDias(
                        9L, List.of(new CapacidadDiaRequest(HOY, 10, null)), UUID.randomUUID()))
                .isInstanceOf(com.nativatrips.backend.common.exception.ResourceNotFoundException.class);
    }

    @Test
    void consultarDiasDevuelveLaOcupacionDeCadaDia() {
        CapacidadDia dia = new CapacidadDia(2L, HOY, 40, (short) 80, UUID.randomUUID());
        given(capacidadDiaRepository.findByFechaBetweenOrderByFechaAscSenderoIdAsc(HOY, HOY.plusDays(6))).willReturn(List.of(dia));
        given(ocupacionDelDia.personasReservadas(2L, HOY)).willReturn(10);

        List<CapacidadDiaResponse> dias = capacidadService.consultarDias(HOY, HOY.plusDays(6));

        assertThat(dias).singleElement().satisfies(d -> {
            assertThat(d.ocupacion()).isEqualTo(10);
            assertThat(d.cupoDisponible()).isEqualTo(30);
            assertThat(d.umbralAlertaSuperado()).isFalse();
        });
    }

    @Test
    void consultarDiasRechazaRangosInvertidosOMuyLargos() {
        assertThatThrownBy(() -> capacidadService.consultarDias(HOY, HOY.minusDays(1)))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> capacidadService.consultarDias(HOY, HOY.plusDays(62)))
                .isInstanceOf(BusinessRuleException.class);
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
    void bloquearLimiteVigenteDevuelveElLimiteBloqueadoDelDia() {
        LocalDate fecha = LocalDate.now().plusDays(2);
        LimiteCapacidad limite = new LimiteCapacidad(1L, fecha, fecha, 20, (short) 80, UUID.randomUUID(), null);
        given(limiteCapacidadRepository.findVigenteParaConBloqueo(1L, fecha)).willReturn(Optional.of(limite));

        assertThat(capacidadService.bloquearLimiteVigente(1L, fecha)).isSameAs(limite);
    }

    @Test
    void bloquearLimiteVigenteRechazaSiNoHayLimiteParaLaFecha() {
        LocalDate fecha = LocalDate.now().plusDays(2);
        given(limiteCapacidadRepository.findVigenteParaConBloqueo(1L, fecha)).willReturn(Optional.empty());

        assertThatThrownBy(() -> capacidadService.bloquearLimiteVigente(1L, fecha))
                .isInstanceOf(BusinessRuleException.class);
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
