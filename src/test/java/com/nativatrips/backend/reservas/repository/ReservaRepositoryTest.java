package com.nativatrips.backend.reservas.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class ReservaRepositoryTest {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void sumaSoloLasPersonasDeReservasEnEstadosActivosParaLaFechaYSenderoIndicados() {
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero de prueba", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000")));
        Usuario turista = usuarioRepository.save(
                new Usuario("turista-reserva@example.com", "hash", "Turista", Rol.TURISTA));

        LocalDate fecha = LocalDate.now().plusDays(5);

        guardarReserva(sendero.getId(), turista.getId(), fecha, 3, EstadoReserva.PENDIENTE_PAGO);
        guardarReserva(sendero.getId(), turista.getId(), fecha, 2, EstadoReserva.CONFIRMADA);
        guardarReserva(sendero.getId(), turista.getId(), fecha, 10, EstadoReserva.CANCELADA);
        guardarReserva(sendero.getId(), turista.getId(), fecha.plusDays(1), 7, EstadoReserva.CONFIRMADA);

        int suma = reservaRepository.sumarPersonasActivas(
                sendero.getId(), fecha, List.of(EstadoReserva.PENDIENTE_PAGO, EstadoReserva.EN_REVISION, EstadoReserva.CONFIRMADA));

        assertThat(suma).isEqualTo(5);
    }

    @Test
    void encuentraSoloReservasPendientesDePagoConBloqueoYaVencido() {
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero de prueba 2", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000")));
        Usuario turista = usuarioRepository.save(
                new Usuario("turista-expira@example.com", "hash", "Turista", Rol.TURISTA));
        LocalDate fecha = LocalDate.now().plusDays(5);

        Reserva vencida = new Reserva(
                sendero.getId(), turista.getId(), fecha, 2, TipoGrupo.ESTANDAR, Instant.now().minusSeconds(60));
        reservaRepository.save(vencida);

        Reserva noVencida = new Reserva(
                sendero.getId(), turista.getId(), fecha, 2, TipoGrupo.ESTANDAR, Instant.now().plusSeconds(900));
        reservaRepository.save(noVencida);

        Reserva vencidaPeroConfirmada = new Reserva(
                sendero.getId(), turista.getId(), fecha, 2, TipoGrupo.ESTANDAR, Instant.now().minusSeconds(60));
        vencidaPeroConfirmada.setEstado(EstadoReserva.CONFIRMADA);
        reservaRepository.save(vencidaPeroConfirmada);

        List<Reserva> vencidas = reservaRepository.findByEstadoAndBloqueoExpiraEnBefore(
                EstadoReserva.PENDIENTE_PAGO, Instant.now());

        assertThat(vencidas).extracting(Reserva::getId).containsExactly(vencida.getId());
    }

    private void guardarReserva(Long senderoId, java.util.UUID turistaId, LocalDate fecha, int personas, EstadoReserva estado) {
        Reserva reserva = new Reserva(senderoId, turistaId, fecha, personas, TipoGrupo.ESTANDAR, null);
        reserva.setEstado(estado);
        reservaRepository.save(reserva);
    }
}
