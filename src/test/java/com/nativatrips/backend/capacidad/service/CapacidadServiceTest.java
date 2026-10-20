package com.nativatrips.backend.capacidad.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.dto.CapacidadDiaRequest;
import com.nativatrips.backend.capacidad.dto.CapacidadDiaResponse;
import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
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

@ExtendWith(MockitoExtension.class)
class CapacidadServiceTest {

    /** Martes 20 de octubre de 2026 en Bogota. */
    private static final LocalDate HOY = LocalDate.of(2026, 10, 20);

    @Mock
    private CapacidadDiaRepository capacidadDiaRepository;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private OcupacionDelDia ocupacionDelDia;

    private CapacidadService capacidadService;

    @BeforeEach
    void setUp() {
        Clock reloj = Clock.fixed(HOY.atTime(9, 0).atZone(RelojConfig.ZONA_OPERACION).toInstant(), RelojConfig.ZONA_OPERACION);
        capacidadService = new CapacidadService(capacidadDiaRepository, senderoRepository, ocupacionDelDia, reloj);
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
                .isInstanceOf(ResourceNotFoundException.class);
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
    void elUltimoDiaReservableEsElDomingoDeLaSemanaSiguiente() {
        // Martes 20 de octubre: la semana en curso termina el domingo 25 y la siguiente el 1 de noviembre.
        assertThat(capacidadService.ultimoDiaReservable()).isEqualTo(LocalDate.of(2026, 11, 1));
    }

    @Test
    void laVentanaAceptaHastaElDomingoDeLaSemanaSiguienteYRechazaDespues() {
        assertThatCode(() -> capacidadService.verificarVentanaDeReserva(LocalDate.of(2026, 11, 1)))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> capacidadService.verificarVentanaDeReserva(LocalDate.of(2026, 11, 2)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("2026-11-01");
    }

    @Test
    void bloquearCapacidadDelDiaDevuelveElDiaBloqueado() {
        CapacidadDia dia = new CapacidadDia(1L, HOY.plusDays(2), 20, (short) 80, UUID.randomUUID());
        given(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(1L, HOY.plusDays(2))).willReturn(Optional.of(dia));

        assertThat(capacidadService.bloquearCapacidadDelDia(1L, HOY.plusDays(2))).isSameAs(dia);
    }

    @Test
    void bloquearCapacidadDelDiaRechazaSiElDiaNoTieneCapacidadPublicada() {
        given(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(1L, HOY.plusDays(2))).willReturn(Optional.empty());

        assertThatThrownBy(() -> capacidadService.bloquearCapacidadDelDia(1L, HOY.plusDays(2)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("capacidad de carga publicada");
    }

    @Test
    void verificarCupoSuficienteRechazaCuandoSeExcedeElCupoDelDia() {
        given(capacidadDiaRepository.findBySenderoIdAndFecha(1L, HOY)).willReturn(Optional.of(
                new CapacidadDia(1L, HOY, 20, (short) 80, UUID.randomUUID())));

        assertThatThrownBy(() -> capacidadService.verificarCupoSuficiente(1L, HOY, 18, 5))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void verificarCupoSuficienteAceptaElUltimoCupo() {
        given(capacidadDiaRepository.findBySenderoIdAndFecha(1L, HOY)).willReturn(Optional.of(
                new CapacidadDia(1L, HOY, 20, (short) 80, UUID.randomUUID())));

        assertThatCode(() -> capacidadService.verificarCupoSuficiente(1L, HOY, 15, 5)).doesNotThrowAnyException();
    }

    @Test
    void calculaDisponibilidadYUmbralDeAlertaDelDia() {
        given(capacidadDiaRepository.findBySenderoIdAndFecha(1L, HOY)).willReturn(Optional.of(
                new CapacidadDia(1L, HOY, 20, (short) 80, UUID.randomUUID())));

        DisponibilidadResponse disponibilidad = capacidadService.verificarDisponibilidad(1L, HOY, 17);

        assertThat(disponibilidad.cupoMaximoDia()).isEqualTo(20);
        assertThat(disponibilidad.cupoDisponible()).isEqualTo(3);
        assertThat(disponibilidad.umbralAlertaSuperado()).isTrue();
    }
}
