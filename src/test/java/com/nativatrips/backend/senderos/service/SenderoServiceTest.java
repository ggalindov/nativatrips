package com.nativatrips.backend.senderos.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.archivos.AlmacenArchivos;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.dto.SenderoRequest;
import com.nativatrips.backend.senderos.model.FotoSendero;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.FotoSenderoRepository;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

class SenderoServiceTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3};

    @TempDir
    Path archivos;

    private final SenderoRepository senderos = mock(SenderoRepository.class);
    private final FotoSenderoRepository fotos = mock(FotoSenderoRepository.class);
    private SenderoService servicio;
    private Sendero siecha;

    @BeforeEach
    void setUp() {
        servicio = new SenderoService(senderos, fotos, new AlmacenArchivos(archivos.toString()),
                Clock.fixed(Instant.parse("2026-10-21T12:00:00Z"), ZoneOffset.UTC));
        siecha = sendero(1L, "Lagunas de Siecha", "Tres lagunas", "Documento y botas");
        given(senderos.findById(1L)).willReturn(Optional.of(siecha));
    }

    @Test
    void elPublicoSoloVeLosSenderosActivosYPublicadosConSusFotos() {
        given(senderos.findByActivoTrueAndPublicadoTrue()).willReturn(List.of(siecha));
        FotoSendero foto = new FotoSendero(1L, "fotos/a.png", "image/png", 0, Instant.now());
        ReflectionTestUtils.setField(foto, "id", UUID.fromString("00000000-0000-0000-0000-000000000001"));
        given(fotos.findBySenderoIdInOrderByOrdenAsc(List.of(1L))).willReturn(List.of(foto));

        var catalogo = servicio.listarActivos();

        assertThat(catalogo).singleElement().satisfies(s -> {
            assertThat(s.requisitosIngreso()).isEqualTo("Documento y botas");
            assertThat(s.fotos()).containsExactly("/api/v1/senderos/1/fotos/00000000-0000-0000-0000-000000000001");
        });
    }

    @Test
    void unBorradorOUnSenderoDeBajaNoTieneFichaPublica() {
        siecha.setPublicado(false);
        assertThatThrownBy(() -> servicio.obtener(1L)).isInstanceOf(ResourceNotFoundException.class);

        siecha.setPublicado(true);
        siecha.setActivo(false);
        assertThatThrownBy(() -> servicio.obtener(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unSenderoNuevoNaceEnBorrador() {
        given(senderos.save(any())).willAnswer(i -> {
            Sendero s = i.getArgument(0);
            ReflectionTestUtils.setField(s, "id", 9L);
            return s;
        });

        var creado = servicio.crear(solicitud("Chorreras"));

        assertThat(creado.publicado()).isFalse();
        assertThat(creado.activo()).isTrue();
        assertThat(creado.horaSalida()).isEqualTo(LocalTime.of(6, 30));
    }

    @Test
    void actualizarCambiaLosDatosYLaFicha() {
        var actualizado = servicio.actualizar(1L, solicitud("Lagunas de Siecha y mirador"));

        assertThat(actualizado.nombre()).isEqualTo("Lagunas de Siecha y mirador");
        assertThat(actualizado.puntoEncuentro()).isEqualTo("Parqueadero Siecha");
        assertThat(actualizado.destacados()).containsExactly("Lagunas", "Frailejones");
    }

    @Test
    void paraPublicarHacenFaltaDescripcionYRequisitos() {
        Sendero incompleto = sendero(2L, "Nuevo", "Bonito", " ");
        incompleto.setPublicado(false);
        given(senderos.findById(2L)).willReturn(Optional.of(incompleto));

        assertThatThrownBy(() -> servicio.cambiarPublicacion(2L, true))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("requisitos");

        siecha.setPublicado(false);
        assertThat(servicio.cambiarPublicacion(1L, true).publicado()).isTrue();
        assertThat(servicio.cambiarPublicacion(1L, false).publicado()).isFalse();
    }

    @Test
    void darDeBajaConReservasFuturasPideConfirmacionYDiceCuantasSon() {
        assertThatThrownBy(() -> servicio.desactivar(1L, 4, false))
                .isInstanceOfSatisfying(BusinessRuleException.class, e -> {
                    assertThat(e.getCodigo()).isEqualTo(SenderoService.RESERVAS_FUTURAS);
                    assertThat(e.getDetalles()).containsEntry("reservasFuturas", 4L);
                });
        assertThat(siecha.isActivo()).isTrue();

        servicio.desactivar(1L, 4, true);
        assertThat(siecha.isActivo()).isFalse();
    }

    @Test
    void sinReservasFuturasLaBajaNoPideConfirmacion() {
        servicio.desactivar(1L, 0, false);

        assertThat(siecha.isActivo()).isFalse();
    }

    @Test
    void unaFotoValidaQuedaGuardadaEnOrden() {
        given(fotos.countBySenderoId(1L)).willReturn(2);

        servicio.agregarFoto(1L, new MockMultipartFile("foto", "laguna.png", "image/png", PNG));

        ArgumentCaptor<FotoSendero> captor = ArgumentCaptor.forClass(FotoSendero.class);
        verify(fotos).save(captor.capture());
        assertThat(captor.getValue().getOrden()).isEqualTo(2);
        assertThat(captor.getValue().getTipo()).isEqualTo("image/png");
        assertThat(archivos.resolve(captor.getValue().getRuta())).exists();
    }

    @Test
    void noSeAceptanMasDeOchoFotosNiArchivosQueNoSonImagenes() {
        given(fotos.countBySenderoId(1L)).willReturn(8);
        assertThatThrownBy(() -> servicio.agregarFoto(1L, new MockMultipartFile("foto", "a.png", "image/png", PNG)))
                .isInstanceOf(BusinessRuleException.class);

        given(fotos.countBySenderoId(1L)).willReturn(0);
        assertThatThrownBy(() -> servicio.agregarFoto(
                        1L, new MockMultipartFile("foto", "a.png", "image/png", "%PDF-1.4".getBytes())))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("tipo");
        verify(fotos, never()).save(any());
    }

    @Test
    void unaFotoDeOtroSenderoNoSeBorraNiSeMuestra() {
        UUID fotoId = UUID.randomUUID();
        given(fotos.findById(fotoId)).willReturn(Optional.of(new FotoSendero(2L, "fotos/x.png", "image/png", 0, Instant.now())));

        assertThatThrownBy(() -> servicio.borrarFoto(1L, fotoId)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> servicio.foto(1L, fotoId)).isInstanceOf(ResourceNotFoundException.class);
    }

    private static Sendero sendero(Long id, String nombre, String descripcion, String requisitos) {
        Sendero sendero = new Sendero(nombre, descripcion, NivelDificultad.MODERADO, 300, "ECOTURISMO", requisitos,
                new BigDecimal("185000"));
        ReflectionTestUtils.setField(sendero, "id", id);
        return sendero;
    }

    private static SenderoRequest solicitud(String nombre) {
        return new SenderoRequest(nombre, "Recorrido", NivelDificultad.EXIGENTE, 480, "ECOTURISMO", "Documento",
                new BigDecimal("225000"), new BigDecimal("16"), 950, 3700, "Choachi", LocalTime.of(6, 30),
                "Parqueadero Siecha", List.of("Lagunas", "Frailejones"));
    }
}
