package com.nativatrips.backend.reservas.job;

import static com.nativatrips.backend.reservas.ReservasDePrueba.reserva;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaIntegranteRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.FichaTecnica;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AvisoPrevioJobTest {

    private static final Instant AHORA = Instant.parse("2026-10-22T13:00:00Z");
    private static final LocalDate HOY = LocalDate.of(2026, 10, 22);

    private final ReservaRepository reservas = mock(ReservaRepository.class);
    private final ReservaIntegranteRepository integrantes = mock(ReservaIntegranteRepository.class);
    private final SenderoRepository senderos = mock(SenderoRepository.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final NotificacionService correo = mock(NotificacionService.class);

    private AvisoPrevioJob job;
    private Reserva reserva;

    @BeforeEach
    void setUp() {
        job = new AvisoPrevioJob(reservas, integrantes, senderos, usuarios, correo,
                Clock.fixed(AHORA, ZoneId.of("America/Bogota")), "https://nativatrips.co");
        Sendero sendero = new Sendero("Lagunas de Siecha", null, NivelDificultad.MODERADO, 300, "ECOTURISMO",
                "Documento de identidad y botas con agarre", BigDecimal.TEN);
        sendero.setFicha(new FichaTecnica(null, null, null, "Siecha", LocalTime.of(7, 0), "Parqueadero Siecha"));
        given(senderos.findById(1L)).willReturn(Optional.of(sendero));

        reserva = reserva(1L, HOY.plusDays(2), 3, TipoGrupo.NECESIDAD_ESPECIAL, null);
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        given(reservas.findByEstadoAndFechaTourBetweenAndAvisoPrevioEnviadoEnIsNull(EstadoReserva.CONFIRMADA, HOY, HOY.plusDays(2)))
                .willReturn(List.of(reserva));
    }

    @Test
    void elTitularRecibeHoraPuntoDeEncuentroYRequisitosYLaReservaQuedaMarcada() {
        job.enviarAvisosPrevios();

        verify(correo).enviarCorreo(eq("laura@example.com"), contains("es en dos días"),
                contains("Parqueadero Siecha"));
        verify(correo).enviarCorreo(eq("laura@example.com"), anyString(), contains("Documento de identidad y botas con agarre"));
        verify(correo).enviarCorreo(eq("laura@example.com"), anyString(), contains("07:00"));
        assertThat(reserva.getAvisoPrevioEnviadoEn()).isEqualTo(AHORA);
    }

    @Test
    void elGuiaAsignadoRecibeLaListaConLosRequerimientosYLosQueFaltanPorRegistrar() {
        UUID guiaId = UUID.randomUUID();
        reserva.setGuiaId(guiaId);
        given(usuarios.findById(guiaId)).willReturn(Optional.of(new Usuario("guia@ecopalacio.co", "h", "Marta", Rol.GUIA_TURISTICO)));
        given(integrantes.findByReservaId(reserva.getId())).willReturn(List.of(
                new ReservaIntegrante(reserva.getId(), "Laura Gomez", TipoDocumento.CC, "1020304050", "CO")));

        job.enviarAvisosPrevios();

        verify(correo).enviarCorreo(eq("guia@ecopalacio.co"), contains("Lista del grupo"), contains("Laura Gomez"));
        verify(correo).enviarCorreo(eq("guia@ecopalacio.co"), anyString(), contains("Silla de ruedas"));
        verify(correo).enviarCorreo(eq("guia@ecopalacio.co"), anyString(), contains("2 acompañante(s) aún sin registrar"));
    }

    @Test
    void sinGuiaAsignadoSoloSaleElCorreoDelTitular() {
        job.enviarAvisosPrevios();

        verify(usuarios, never()).findById(org.mockito.ArgumentMatchers.any());
    }
}
