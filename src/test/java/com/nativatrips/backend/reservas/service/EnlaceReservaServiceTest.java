package com.nativatrips.backend.reservas.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.reservas.model.AccesoEnlaceReserva;
import com.nativatrips.backend.reservas.model.EnlaceReserva;
import com.nativatrips.backend.reservas.model.PropositoEnlace;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TitularReserva;
import com.nativatrips.backend.reservas.repository.AccesoEnlaceReservaRepository;
import com.nativatrips.backend.reservas.repository.EnlaceReservaRepository;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

/** HU-18 (NAT-112): enlace unico, con vencimiento, revocable y con registro de cada uso. */
@ExtendWith(MockitoExtension.class)
class EnlaceReservaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-10-20T15:00:00Z");
    private static final LocalDate FECHA_TOUR = LocalDate.of(2026, 10, 24);

    @Mock
    private EnlaceReservaRepository enlaceRepository;

    @Mock
    private AccesoEnlaceReservaRepository accesoRepository;

    @Mock
    private ReservaRepository reservaRepository;

    private EnlaceReservaService servicio;
    private Reserva reserva;

    @BeforeEach
    void setUp() {
        servicio = new EnlaceReservaService(
                enlaceRepository, accesoRepository, reservaRepository, Clock.fixed(AHORA, ZoneOffset.UTC),
                "https://nativatrips.co/");
        reserva = Reserva.sinCuenta(1L, FECHA_TOUR, 2, AHORA.plusSeconds(900), "NT-7Q4KX2", new TitularReserva(
                "Laura Gomez", TipoDocumento.CC, "1020304050", "CO", "laura@example.com", "57", "3001234567"));
        ReflectionTestUtils.setField(reserva, "id", UUID.randomUUID());
    }

    @Test
    void elEnlaceLlevaUnTokenDe256BitsYEnLaBaseSoloQuedaSuHash() {
        EnlaceReservaService.EnlaceEmitido emitido = servicio.emitir(reserva);

        assertThat(emitido.url()).matches("https://nativatrips\\.co/mi-reserva/[A-Za-z0-9_-]{43}");
        String token = emitido.url().substring(emitido.url().lastIndexOf('/') + 1);
        ArgumentCaptor<EnlaceReserva> guardado = ArgumentCaptor.forClass(EnlaceReserva.class);
        verify(enlaceRepository).save(guardado.capture());
        assertThat(ReflectionTestUtils.getField(guardado.getValue(), "tokenHash")).isEqualTo(TokenSeguro.hash(token));
        assertThat(guardado.getValue().getProposito()).isEqualTo(PropositoEnlace.GESTIONAR_RESERVA);
    }

    @Test
    void sirveHastaQueTerminaElDiaDelTourEnHoraDeColombia() {
        EnlaceReservaService.EnlaceEmitido emitido = servicio.emitir(reserva);

        // 25 de octubre a las 00:00 en Bogota = 05:00 UTC.
        assertThat(emitido.expiraEn()).isEqualTo(Instant.parse("2026-10-25T05:00:00Z"));
    }

    @Test
    void emitirUnEnlaceNuevoRevocaLosAnteriores() {
        EnlaceReserva anterior = enlace(AHORA.plusSeconds(86_400));
        given(enlaceRepository.findByReservaIdAndPropositoAndRevocadoEnIsNull(reserva.getId(), PropositoEnlace.GESTIONAR_RESERVA))
                .willReturn(List.of(anterior));

        servicio.emitir(reserva);

        assertThat(anterior.getRevocadoEn()).isEqualTo(AHORA);
        assertThat(anterior.estaVigente(AHORA)).isFalse();
    }

    @Test
    void unEnlaceVigenteAbreLaReservaVariasVecesYCadaUsoQuedaRegistrado() {
        EnlaceReserva vigente = enlace(AHORA.plusSeconds(86_400));
        given(enlaceRepository.findByTokenHash(TokenSeguro.hash("token-valido"))).willReturn(Optional.of(vigente));
        given(reservaRepository.findById(reserva.getId())).willReturn(Optional.of(reserva));

        assertThat(servicio.abrir("token-valido", "CONSULTAR", "190.1.1.1")).isSameAs(reserva);
        assertThat(servicio.abrir("token-valido", "PAGAR", "190.1.1.1")).isSameAs(reserva);

        ArgumentCaptor<AccesoEnlaceReserva> accesos = ArgumentCaptor.forClass(AccesoEnlaceReserva.class);
        verify(accesoRepository, org.mockito.Mockito.times(2)).save(accesos.capture());
        assertThat(accesos.getAllValues()).extracting(AccesoEnlaceReserva::getAccion).containsExactly("CONSULTAR", "PAGAR");
        assertThat(accesos.getAllValues()).extracting(AccesoEnlaceReserva::getIp).containsOnly("190.1.1.1");
    }

    @Test
    void unEnlaceVencidoRevocadoODesconocidoNoMuestraNada() {
        EnlaceReserva vencido = enlace(AHORA.minusSeconds(1));
        EnlaceReserva revocado = enlace(AHORA.plusSeconds(86_400));
        revocado.revocar(AHORA.minusSeconds(60));
        given(enlaceRepository.findByTokenHash(TokenSeguro.hash("vencido"))).willReturn(Optional.of(vencido));
        given(enlaceRepository.findByTokenHash(TokenSeguro.hash("revocado"))).willReturn(Optional.of(revocado));

        for (String token : List.of("vencido", "revocado", "desconocido", " ")) {
            assertThatThrownBy(() -> servicio.abrir(token, "CONSULTAR", "190.1.1.1"))
                    .isInstanceOfSatisfying(BusinessRuleException.class, ex -> {
                        assertThat(ex.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                        assertThat(ex.getCodigo()).isEqualTo(EnlaceReservaService.ENLACE_INVALIDO);
                    });
        }
        verify(accesoRepository, never()).save(any());
        verify(reservaRepository, never()).findById(any());
    }

    private EnlaceReserva enlace(Instant expiraEn) {
        EnlaceReserva enlace = new EnlaceReserva(reserva.getId(), "hash", PropositoEnlace.GESTIONAR_RESERVA, expiraEn, AHORA);
        ReflectionTestUtils.setField(enlace, "id", UUID.randomUUID());
        return enlace;
    }
}
