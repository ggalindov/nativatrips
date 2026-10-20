package com.nativatrips.backend.reservas.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.dto.IntegranteRequest;
import com.nativatrips.backend.reservas.dto.ReservaRequest;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaEstadoHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReservaServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private ReservaIntegranteRepository reservaIntegranteRepository;

    @Mock
    private ReservaEstadoHistorialRepository historialRepository;

    @Mock
    private SenderoRepository senderoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private CapacidadService capacidadService;

    @Mock
    private NotificacionService notificacionService;

    private ReservaService reservaService;

    @BeforeEach
    void setUp() {
        reservaService = new ReservaService(
                reservaRepository,
                reservaIntegranteRepository,
                historialRepository,
                senderoRepository,
                usuarioRepository,
                capacidadService,
                notificacionService);
    }

    @Test
    void rechazaReservaSiElSenderoNoExisteOEstaInactivo() {
        given(senderoRepository.findById(1L)).willReturn(Optional.empty());
        var request = new ReservaRequest(
                1L, LocalDate.now().plusDays(1), TipoGrupo.ESTANDAR, List.of(new IntegranteRequest("Juan", "123")));

        assertThatThrownBy(() -> reservaService.crearReserva(request, UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void rechazaLaReservaFueraDeLaVentanaSinTocarLaCapacidad() {
        LocalDate lejana = LocalDate.now().plusWeeks(5);
        given(senderoRepository.findById(1L)).willReturn(Optional.of(unSendero()));
        org.mockito.BDDMockito.willThrow(new BusinessRuleException(org.springframework.http.HttpStatus.CONFLICT, "fuera de la ventana"))
                .given(capacidadService)
                .verificarVentanaDeReserva(lejana);

        var request = new ReservaRequest(1L, lejana, TipoGrupo.ESTANDAR, List.of(new IntegranteRequest("Juan", "123")));

        assertThatThrownBy(() -> reservaService.crearReserva(request, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
        verify(capacidadService, never()).bloquearCapacidadDelDia(any(), any());
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void propagaElRechazoDeCapacidadCuandoNoHayCupoSuficiente() {
        Sendero sendero = unSendero();
        given(senderoRepository.findById(1L)).willReturn(Optional.of(sendero));
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(18);
        org.mockito.BDDMockito.willThrow(new BusinessRuleException(org.springframework.http.HttpStatus.CONFLICT, "sin cupo"))
                .given(capacidadService)
                .verificarCupoSuficiente(1L, LocalDate.now().plusDays(1), 18, 2);

        var request = new ReservaRequest(
                1L,
                LocalDate.now().plusDays(1),
                TipoGrupo.ESTANDAR,
                List.of(new IntegranteRequest("Juan", "123"), new IntegranteRequest("Ana", "456")));

        assertThatThrownBy(() -> reservaService.crearReserva(request, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void verificaLaVentanaYBloqueaLaCapacidadDelDiaAntesDeContarLaOcupacion() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        given(senderoRepository.findById(1L)).willReturn(Optional.of(unSendero()));
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(0);
        given(reservaRepository.save(any())).willAnswer(this::conIdGenerado);
        given(reservaIntegranteRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        reservaService.crearReserva(
                new ReservaRequest(1L, fecha, TipoGrupo.ESTANDAR, List.of(new IntegranteRequest("Juan", "123"))),
                UUID.randomUUID());

        InOrder orden = Mockito.inOrder(capacidadService, reservaRepository);
        orden.verify(capacidadService).verificarVentanaDeReserva(fecha);
        orden.verify(capacidadService).bloquearCapacidadDelDia(1L, fecha);
        orden.verify(reservaRepository).sumarPersonasActivas(anyLong(), any(), any());
        orden.verify(capacidadService).verificarCupoSuficiente(1L, fecha, 0, 1);
    }

    @Test
    void creaLaReservaEnEstadoPendientePagoConBloqueoTemporalYRegistraHistorial() {
        Sendero sendero = unSendero();
        given(senderoRepository.findById(1L)).willReturn(Optional.of(sendero));
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(0);
        given(reservaRepository.save(any())).willAnswer(this::conIdGenerado);
        given(reservaIntegranteRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));

        var request = new ReservaRequest(
                1L, LocalDate.now().plusDays(1), TipoGrupo.ESTANDAR, List.of(new IntegranteRequest("Juan", "123")));

        var response = reservaService.crearReserva(request, UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
        assertThat(response.bloqueoExpiraEn()).isNotNull();
        assertThat(response.integrantes()).hasSize(1);
        verify(historialRepository).save(any());
    }

    @Test
    void transicionarEstadoLiberaElBloqueoAlConfirmar() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR,
                java.time.Instant.now().plusSeconds(900));
        given(reservaRepository.findById(any())).willReturn(Optional.of(reserva));

        Reserva actualizada = reservaService.transicionarEstado(
                UUID.randomUUID(), EstadoReserva.CONFIRMADA, "Pago aprobado", OrigenCambioEstado.PAGO, null);

        assertThat(actualizada.getEstado()).isEqualTo(EstadoReserva.CONFIRMADA);
        assertThat(actualizada.getBloqueoExpiraEn()).isNull();
        verify(historialRepository).save(any());
    }

    @Test
    void obtenerParaTuristaRechazaReservaDeOtroUsuario() {
        UUID duenioReal = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, duenioReal, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.obtenerParaTurista(reservaId, UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void cancelarPorTuristaFuncionaDesdePendientePagoYLiberaElBloqueo() {
        UUID turistaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, turistaId, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR,
                java.time.Instant.now().plusSeconds(900));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        var response = reservaService.cancelarPorTurista(reservaId, turistaId, "Cambio de planes");

        assertThat(response.estado()).isEqualTo(EstadoReserva.CANCELADA);
        assertThat(response.bloqueoExpiraEn()).isNull();
    }

    @Test
    void cancelarPorTuristaRechazaReservaDeOtroUsuario() {
        UUID duenioReal = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, duenioReal, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.cancelarPorTurista(reservaId, UUID.randomUUID(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void cancelarPorTuristaRechazaSiYaEstaCanceladaOExpirada() {
        UUID turistaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, turistaId, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setEstado(EstadoReserva.EXPIRADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.cancelarPorTurista(reservaId, turistaId, null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void obtenerHistorialParaTuristaRechazaReservaDeOtroUsuario() {
        UUID duenioReal = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, duenioReal, LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.obtenerHistorialParaTurista(reservaId, UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void calculaDisponibilidadDelegandoEnCapacidadService() {
        given(senderoRepository.existsById(1L)).willReturn(true);
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(4);
        var esperada = new DisponibilidadResponse(1L, LocalDate.now(), 20, 4, 16, false);
        given(capacidadService.verificarDisponibilidad(1L, LocalDate.now(), 4)).willReturn(esperada);

        var disponibilidad = reservaService.obtenerDisponibilidad(1L, LocalDate.now());

        assertThat(disponibilidad).isEqualTo(esperada);
    }

    @Test
    void creaReservaDeGrupoCorporativoEnRevisionSinBloqueoYNotificaAdministradores() {
        Sendero sendero = unSendero();
        given(senderoRepository.findById(1L)).willReturn(Optional.of(sendero));
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(0);
        given(reservaRepository.save(any())).willAnswer(this::conIdGenerado);
        given(reservaIntegranteRepository.save(any())).willAnswer(invocation -> invocation.getArgument(0));
        var admin = new com.nativatrips.backend.usuarios.model.Usuario(
                "admin@example.com", "hash", "Admin", com.nativatrips.backend.usuarios.model.Rol.ADMINISTRADOR);
        given(usuarioRepository.findByRolAndActivoTrue(com.nativatrips.backend.usuarios.model.Rol.ADMINISTRADOR))
                .willReturn(List.of(admin));

        var request = new ReservaRequest(
                1L, LocalDate.now().plusDays(1), TipoGrupo.GRUPO_CORPORATIVO, List.of(new IntegranteRequest("Juan", "123")));

        var response = reservaService.crearReserva(request, UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.EN_REVISION);
        assertThat(response.bloqueoExpiraEn()).isNull();
        verify(notificacionService).enviarCorreo(org.mockito.ArgumentMatchers.eq("admin@example.com"), any(), any());
    }

    @Test
    void revisarReservaAprobadaPasaAPendientePagoConNuevoBloqueo() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 5, TipoGrupo.GRUPO_CORPORATIVO, null);
        reserva.setEstado(EstadoReserva.EN_REVISION);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        var response = reservaService.revisarReserva(reservaId, true, null, UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
        assertThat(response.bloqueoExpiraEn()).isNotNull();
    }

    @Test
    void revisarReservaRechazadaPasaACancelada() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 5, TipoGrupo.NECESIDAD_ESPECIAL, null);
        reserva.setEstado(EstadoReserva.EN_REVISION);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        var response = reservaService.revisarReserva(reservaId, false, "No cumple requisitos", UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.CANCELADA);
    }

    @Test
    void revisarReservaQueNoEstaEnRevisionEsRechazada() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 5, TipoGrupo.ESTANDAR,
                java.time.Instant.now().plusSeconds(900));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.revisarReserva(reservaId, true, null, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void asignarGuiaFallaSiLaReservaNoEstaConfirmada() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR,
                java.time.Instant.now().plusSeconds(900));
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.asignarGuia(reservaId, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void asignarGuiaFallaSiElUsuarioNoEsGuiaActivo() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));
        given(usuarioRepository.findById(any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.asignarGuia(reservaId, UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void asignarGuiaExitosaCuandoLaReservaEstaConfirmadaYElUsuarioEsGuiaActivo() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        UUID guiaId = UUID.randomUUID();
        var guia = new com.nativatrips.backend.usuarios.model.Usuario(
                "guia@example.com", "hash", "Guia", com.nativatrips.backend.usuarios.model.Rol.GUIA_TURISTICO);
        ReflectionTestUtils.setField(guia, "id", guiaId);
        given(usuarioRepository.findById(guiaId)).willReturn(Optional.of(guia));

        var response = reservaService.asignarGuia(reservaId, guiaId);

        assertThat(response.guiaId()).isEqualTo(guiaId);
    }

    @Test
    void agendaGuiaSinFechaSoloIncluyeToursDesdeHoy() {
        UUID guiaId = UUID.randomUUID();
        Reserva pasada = new Reserva(1L, UUID.randomUUID(), LocalDate.now().minusDays(1), 2, TipoGrupo.ESTANDAR, null);
        Reserva futura = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        ReflectionTestUtils.setField(pasada, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(futura, "id", UUID.randomUUID());
        given(reservaRepository.findByGuiaIdOrderByFechaTourAsc(guiaId)).willReturn(List.of(pasada, futura));

        var agenda = reservaService.obtenerAgendaGuia(guiaId, null);

        assertThat(agenda).hasSize(1);
        assertThat(agenda.get(0).fechaTour()).isEqualTo(futura.getFechaTour());
    }

    @Test
    void obtenerTuristasParaGuiaRechazaSiLaReservaNoLePerteneceAEseGuia() {
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setGuiaId(UUID.randomUUID());
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.obtenerTuristasParaGuia(reservaId, UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void registrarAsistenciaFallaSiElTourEsEnElFuturo() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null);
        reserva.setGuiaId(guiaId);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.registrarAsistencia(reservaId, guiaId))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void registrarAsistenciaCompletaLaReservaYRegistraLaFechaDeAsistencia() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = new Reserva(1L, UUID.randomUUID(), LocalDate.now(), 2, TipoGrupo.ESTANDAR, null);
        reserva.setGuiaId(guiaId);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        UUID reservaId = UUID.randomUUID();
        ReflectionTestUtils.setField(reserva, "id", reservaId);
        given(reservaRepository.findById(reservaId)).willReturn(Optional.of(reserva));

        var response = reservaService.registrarAsistencia(reservaId, guiaId);

        assertThat(response.estado()).isEqualTo(EstadoReserva.COMPLETADA);
        assertThat(reserva.getAsistenciaRegistradaEn()).isNotNull();
    }

    private Reserva conIdGenerado(InvocationOnMock invocation) {
        Reserva reserva = invocation.getArgument(0);
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
        return reserva;
    }

    private static Sendero unSendero() {
        Sendero sendero = new Sendero(
                "Sendero test", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000"));
        ReflectionTestUtils.setField(sendero, "id", 1L);
        return sendero;
    }
}
