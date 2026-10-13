package com.nativatrips.backend.pagos.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class PagoRepositoryTest {

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void encuentraElPagoMasRecientePendienteDeUnaReserva() {
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero pago", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000")));
        Usuario turista = usuarioRepository.save(new Usuario("pago@example.com", "hash", "Turista", Rol.TURISTA));
        Reserva reserva = reservaRepository.save(new Reserva(
                sendero.getId(), turista.getId(), LocalDate.now().plusDays(1), 2, TipoGrupo.ESTANDAR, null));

        Pago rechazado = pagoRepository.save(
                new Pago(reserva.getId(), "REF-1", new BigDecimal("20000"), "COP"));
        rechazado.setEstado(EstadoPago.RECHAZADO);
        pagoRepository.saveAndFlush(rechazado);

        Pago pendiente = pagoRepository.save(new Pago(reserva.getId(), "REF-2", new BigDecimal("20000"), "COP"));

        var encontrado = pagoRepository.findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(
                reserva.getId(), EstadoPago.PENDIENTE);

        assertThat(encontrado).isPresent();
        assertThat(encontrado.get().getId()).isEqualTo(pendiente.getId());
    }

    @Test
    void encuentraPorReferenciaPayu() {
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero pago 2", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000")));
        Usuario turista = usuarioRepository.save(new Usuario("pago2@example.com", "hash", "Turista", Rol.TURISTA));
        Reserva reserva = reservaRepository.save(new Reserva(
                sendero.getId(), turista.getId(), LocalDate.now().plusDays(1), 1, TipoGrupo.ESTANDAR, null));
        pagoRepository.save(new Pago(reserva.getId(), "REF-UNICA", new BigDecimal("10000"), "COP"));

        assertThat(pagoRepository.findByReferenciaPayu("REF-UNICA")).isPresent();
        assertThat(pagoRepository.findByReferenciaPayu("NO-EXISTE")).isEmpty();
    }
}
