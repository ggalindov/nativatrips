package com.nativatrips.backend.reservas.service;

import static com.nativatrips.backend.reservas.ReservasDePrueba.reserva;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.dto.DisponibilidadResponse;
import com.nativatrips.backend.capacidad.service.CapacidadService;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.panel.service.AvisosDeOperacion;
import com.nativatrips.backend.reservas.dto.ReservaSinCuentaRequest;
import com.nativatrips.backend.reservas.dto.TitularRequest;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.OrigenCambioEstado;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaEstadoHistorialRepository;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Instant;
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
import org.springframework.http.HttpStatus;
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

    @Mock
    private EnlaceReservaService enlaceService;

    @Mock
    private AvisosDeOperacion avisosDeOperacion;

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
                notificacionService,
                new GeneradorCodigoReserva(),
                enlaceService,
                avisosDeOperacion);
    }

    @Test
    void rechazaReservaSiElSenderoNoExisteOEstaInactivo() {
        given(senderoRepository.findById(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.crearReservaSinCuenta(solicitud(LocalDate.now().plusDays(1), 1)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void rechazaLaReservaFueraDeLaVentanaSinTocarLaCapacidad() {
        LocalDate lejana = LocalDate.now().plusWeeks(5);
        given(senderoRepository.findById(1L)).willReturn(Optional.of(unSendero()));
        willThrow(new BusinessRuleException(HttpStatus.CONFLICT, "fuera de la ventana"))
                .given(capacidadService)
                .verificarVentanaDeReserva(lejana);

        assertThatThrownBy(() -> reservaService.crearReservaSinCuenta(solicitud(lejana, 1)))
                .isInstanceOf(BusinessRuleException.class);
        verify(capacidadService, never()).bloquearCapacidadDelDia(any(), any());
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void verificaLaVentanaYBloqueaLaCapacidadDelDiaAntesDeContarLaOcupacion() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        prepararCreacion();

        reservaService.crearReservaSinCuenta(solicitud(fecha, 1));

        InOrder orden = Mockito.inOrder(capacidadService, reservaRepository);
        orden.verify(capacidadService).verificarVentanaDeReserva(fecha);
        orden.verify(capacidadService).bloquearCapacidadDelDia(1L, fecha);
        orden.verify(reservaRepository).sumarPersonasActivas(anyLong(), any(), any());
        orden.verify(capacidadService).verificarCupoSuficiente(1L, fecha, 0, 1);
    }

    @Test
    void laReservaEstandarQuedaPendienteDePagoConBloqueoYAvisoAlTitular() {
        prepararCreacion();

        var apartada = reservaService.crearReservaSinCuenta(solicitud(LocalDate.now().plusDays(1), 2));

        assertThat(apartada.estado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
        assertThat(apartada.bloqueoExpiraEn()).isNotNull();
        verify(notificacionService).enviarCorreo(eq("laura@example.com"), contains("Tu cupo esta apartado"), any());
        verify(usuarioRepository, never()).findByRolAndActivoTrue(any());
    }

    @Test
    void unGrupoCorporativoSinCuentaPasaARevisionSinConteoYAvisaAlTitularYAlEquipo() {
        prepararCreacion();
        given(usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR))
                .willReturn(List.of(new Usuario("admin@ecopalacio.co", "hash", "Admin", Rol.ADMINISTRADOR)));

        var apartada = reservaService.crearReservaSinCuenta(
                solicitud(LocalDate.now().plusDays(1), 12, TipoGrupo.GRUPO_CORPORATIVO, null));

        assertThat(apartada.estado()).isEqualTo(EstadoReserva.EN_REVISION);
        assertThat(apartada.bloqueoExpiraEn()).isNull();
        verify(notificacionService).enviarCorreo(eq("laura@example.com"), contains("Recibimos tu solicitud"), any());
        verify(notificacionService).enviarCorreo(eq("admin@ecopalacio.co"), contains("en revisión"), any());
    }

    @Test
    void cadaReservaNuevaLlegaAlPanelYSeRevisaElUmbralDelDia() {
        prepararCreacion();

        reservaService.crearReservaSinCuenta(solicitud(LocalDate.now().plusDays(1), 2));

        verify(avisosDeOperacion).reserva(any(), any());
        verify(avisosDeOperacion).siCruzaElUmbral(any(), any(), eq(0), eq(2));
    }

    @Test
    void elPanelNoAceptaRangosInvertidosNiDeMasDeDosMeses() {
        LocalDate hoy = LocalDate.now();
        assertThatThrownBy(() -> reservaService.listarParaPanel(hoy, hoy.minusDays(1), null))
                .isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(() -> reservaService.listarParaPanel(hoy, hoy.plusDays(63), null))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void elPanelFiltraPorEstado() {
        LocalDate hoy = LocalDate.now();
        Reserva confirmada = confirmada(hoy);
        Reserva pendiente = conId(reserva(1L, hoy, 2, Instant.now().plusSeconds(900)));
        given(reservaRepository.findByFechaTourBetweenOrderByFechaTourAscCreatedAtAsc(hoy, hoy))
                .willReturn(List.of(confirmada, pendiente));

        assertThat(reservaService.listarParaPanel(hoy, hoy, EstadoReserva.CONFIRMADA))
                .extracting(r -> r.codigoReserva()).containsExactly(confirmada.getCodigoReserva());
        assertThat(reservaService.listarParaPanel(hoy, hoy, null)).hasSize(2);
    }

    @Test
    void unGrupoConNecesidadesEspecialesDebeDecirQueNecesita() {
        assertThatThrownBy(() -> reservaService.crearReservaSinCuenta(
                        solicitud(LocalDate.now().plusDays(1), 3, TipoGrupo.NECESIDAD_ESPECIAL, "  ")))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("que necesita el grupo");
        verify(reservaRepository, never()).save(any());
    }

    @Test
    void losRequerimientosEspecialesQuedanEnLaReserva() {
        prepararCreacion();
        given(usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR)).willReturn(List.of());

        reservaService.crearReservaSinCuenta(
                solicitud(LocalDate.now().plusDays(1), 3, TipoGrupo.NECESIDAD_ESPECIAL, " Silla de ruedas "));

        var captor = org.mockito.ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository).save(captor.capture());
        assertThat(captor.getValue().getRequerimientosEspeciales()).isEqualTo("Silla de ruedas");
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoReserva.EN_REVISION);
    }

    @Test
    void transicionarEstadoLiberaElBloqueoAlConfirmar() {
        Reserva reserva = reserva(1L, LocalDate.now().plusDays(1), 2, Instant.now().plusSeconds(900));
        given(reservaRepository.findById(any())).willReturn(Optional.of(reserva));

        Reserva actualizada = reservaService.transicionarEstado(
                UUID.randomUUID(), EstadoReserva.CONFIRMADA, "Pago aprobado", OrigenCambioEstado.PAGO, null);

        assertThat(actualizada.getEstado()).isEqualTo(EstadoReserva.CONFIRMADA);
        assertThat(actualizada.getBloqueoExpiraEn()).isNull();
        verify(historialRepository).save(any());
    }

    @Test
    void calculaDisponibilidadDelegandoEnCapacidadService() {
        given(senderoRepository.existsById(1L)).willReturn(true);
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(4);
        var esperada = new DisponibilidadResponse(1L, LocalDate.now(), 20, 4, 16, false);
        given(capacidadService.verificarDisponibilidad(1L, LocalDate.now(), 4)).willReturn(esperada);

        assertThat(reservaService.obtenerDisponibilidad(1L, LocalDate.now())).isEqualTo(esperada);
    }

    @Test
    void aprobarLaRevisionAbreElConteoYEnviaUnEnlaceNuevoParaPagar() {
        Reserva reserva = conId(reserva(1L, LocalDate.now().plusDays(1), 5, TipoGrupo.GRUPO_CORPORATIVO, null));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        given(senderoRepository.findById(1L)).willReturn(Optional.of(unSendero()));
        given(enlaceService.emitir(reserva))
                .willReturn(new EnlaceReservaService.EnlaceEmitido("http://localhost:3000/mi-reserva/nuevo", Instant.now()));

        var response = reservaService.revisarReserva(reserva.getId(), true, null, UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.PENDIENTE_PAGO);
        assertThat(response.bloqueoExpiraEn()).isNotNull();
        verify(notificacionService).enviarCorreo(
                eq("laura@example.com"), contains("fue aprobada"), contains("http://localhost:3000/mi-reserva/nuevo"));
    }

    @Test
    void rechazarLaRevisionCancelaYLeDiceElMotivoAlTitular() {
        Reserva reserva = conId(reserva(1L, LocalDate.now().plusDays(1), 5, TipoGrupo.NECESIDAD_ESPECIAL, null));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        var response = reservaService.revisarReserva(reserva.getId(), false, "No hay guia de apoyo ese dia", UUID.randomUUID());

        assertThat(response.estado()).isEqualTo(EstadoReserva.CANCELADA);
        verify(notificacionService).enviarCorreo(
                eq("laura@example.com"), contains("no fue aprobada"), contains("No hay guia de apoyo ese dia"));
    }

    @Test
    void revisarReservaQueNoEstaEnRevisionEsRechazada() {
        Reserva reserva = conId(reserva(1L, LocalDate.now().plusDays(1), 5, Instant.now().plusSeconds(900)));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.revisarReserva(reserva.getId(), true, null, UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void asignarGuiaFallaSiLaReservaNoEstaConfirmada() {
        Reserva reserva = conId(reserva(1L, LocalDate.now().plusDays(1), 2, Instant.now().plusSeconds(900)));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.asignarGuia(reserva.getId(), UUID.randomUUID()))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void asignarGuiaFallaSiElUsuarioNoEsGuiaActivo() {
        Reserva reserva = confirmada(LocalDate.now().plusDays(1));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        given(usuarioRepository.findById(any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.asignarGuia(reserva.getId(), UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void asignarGuiaExitosaCuandoLaReservaEstaConfirmadaYElUsuarioEsGuiaActivo() {
        Reserva reserva = confirmada(LocalDate.now().plusDays(1));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        UUID guiaId = UUID.randomUUID();
        var guia = new Usuario("guia@example.com", "hash", "Guia", Rol.GUIA_TURISTICO);
        ReflectionTestUtils.setField(guia, "id", guiaId);
        given(usuarioRepository.findById(guiaId)).willReturn(Optional.of(guia));

        assertThat(reservaService.asignarGuia(reserva.getId(), guiaId).guiaId()).isEqualTo(guiaId);
    }

    @Test
    void agendaGuiaSinFechaSoloIncluyeToursDesdeHoy() {
        UUID guiaId = UUID.randomUUID();
        Reserva pasada = conId(reserva(1L, LocalDate.now().minusDays(1), 2, null));
        Reserva futura = conId(reserva(1L, LocalDate.now().plusDays(1), 2, null));
        given(reservaRepository.findByGuiaIdOrderByFechaTourAsc(guiaId)).willReturn(List.of(pasada, futura));

        var agenda = reservaService.obtenerAgendaGuia(guiaId, null);

        assertThat(agenda).extracting(r -> r.fechaTour()).containsExactly(futura.getFechaTour());
    }

    @Test
    void obtenerTuristasParaGuiaRechazaSiLaReservaNoLePerteneceAEseGuia() {
        Reserva reserva = conId(reserva(1L, LocalDate.now().plusDays(1), 2, null));
        reserva.setGuiaId(UUID.randomUUID());
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.obtenerTuristasParaGuia(reserva.getId(), UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void laListaDelGuiaTraeLasVisitasPreviasDeCadaPersona() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = confirmada(LocalDate.now());
        reserva.setGuiaId(guiaId);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        ReservaIntegrante laura = new ReservaIntegrante(reserva.getId(), "Laura Gomez", TipoDocumento.CC, "1020304050", "CO");
        given(reservaIntegranteRepository.findByReservaId(reserva.getId())).willReturn(List.of(laura));
        given(reservaIntegranteRepository.contarVisitasPrevias(
                TipoDocumento.CC, "1020304050", reserva.getId(), EstadoReserva.COMPLETADA)).willReturn(3L);

        var lista = reservaService.obtenerTuristasParaGuia(reserva.getId(), guiaId);

        assertThat(lista).singleElement().satisfies(p -> assertThat(p.visitasPrevias()).isEqualTo(3));
    }

    @Test
    void elGuiaMarcaLaAsistenciaDeUnaPersonaDeSuSalida() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = confirmada(LocalDate.now());
        reserva.setGuiaId(guiaId);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        ReservaIntegrante laura = new ReservaIntegrante(reserva.getId(), "Laura Gomez", TipoDocumento.CC, "1020304050", "CO");
        UUID integranteId = UUID.randomUUID();
        given(reservaIntegranteRepository.findById(integranteId)).willReturn(Optional.of(laura));

        var marcada = reservaService.marcarAsistenciaIntegrante(reserva.getId(), integranteId, false, guiaId);

        assertThat(marcada.asistio()).isFalse();
        assertThat(laura.getAsistio()).isFalse();
    }

    @Test
    void noSeMarcaAsistenciaDeAlguienDeOtraReserva() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = confirmada(LocalDate.now());
        reserva.setGuiaId(guiaId);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));
        UUID integranteId = UUID.randomUUID();
        given(reservaIntegranteRepository.findById(integranteId)).willReturn(Optional.of(
                new ReservaIntegrante(UUID.randomUUID(), "Otra", TipoDocumento.CC, "999999", "CO")));

        assertThatThrownBy(() -> reservaService.marcarAsistenciaIntegrante(reserva.getId(), integranteId, true, guiaId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void registrarAsistenciaFallaSiElTourEsEnElFuturo() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = confirmada(LocalDate.now().plusDays(1));
        reserva.setGuiaId(guiaId);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaService.registrarAsistencia(reserva.getId(), guiaId))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void registrarAsistenciaCompletaLaReservaYRegistraLaFechaDeAsistencia() {
        UUID guiaId = UUID.randomUUID();
        Reserva reserva = confirmada(LocalDate.now());
        reserva.setGuiaId(guiaId);
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        var response = reservaService.registrarAsistencia(reserva.getId(), guiaId);

        assertThat(response.estado()).isEqualTo(EstadoReserva.COMPLETADA);
        assertThat(reserva.getAsistenciaRegistradaEn()).isNotNull();
    }

    private void prepararCreacion() {
        given(senderoRepository.findById(1L)).willReturn(Optional.of(unSendero()));
        given(reservaRepository.sumarPersonasActivas(anyLong(), any(), any())).willReturn(0);
        given(reservaRepository.save(any())).willAnswer(this::conIdGenerado);
        given(enlaceService.emitir(any()))
                .willReturn(new EnlaceReservaService.EnlaceEmitido("http://localhost:3000/mi-reserva/t", Instant.now()));
    }

    private static ReservaSinCuentaRequest solicitud(LocalDate fecha, int personas) {
        return solicitud(fecha, personas, null, null);
    }

    private static ReservaSinCuentaRequest solicitud(LocalDate fecha, int personas, TipoGrupo tipo, String requerimientos) {
        return new ReservaSinCuentaRequest(
                1L, fecha, personas,
                new TitularRequest("Laura Gomez", TipoDocumento.CC, "1020304050", "CO", "laura@example.com", "57", "3001234567"),
                List.of(), tipo, requerimientos);
    }

    private static Reserva confirmada(LocalDate fecha) {
        Reserva reserva = conId(reserva(1L, fecha, 2, null));
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        return reserva;
    }

    private static Reserva conId(Reserva reserva) {
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
        return reserva;
    }

    private Reserva conIdGenerado(InvocationOnMock invocation) {
        return conId(invocation.getArgument(0));
    }

    private static Sendero unSendero() {
        Sendero sendero = new Sendero(
                "Sendero test", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000"));
        ReflectionTestUtils.setField(sendero, "id", 1L);
        return sendero;
    }
}
