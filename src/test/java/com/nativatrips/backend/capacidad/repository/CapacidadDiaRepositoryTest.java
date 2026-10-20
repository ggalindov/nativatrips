package com.nativatrips.backend.capacidad.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class CapacidadDiaRepositoryTest {

    @Autowired
    private CapacidadDiaRepository capacidadDiaRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void consultaLosDiasDelRangoOrdenadosYEncuentraElDiaConBloqueo() {
        Long senderoId = unSendero().getId();
        UUID adminId = unAdministrador().getId();
        LocalDate lunes = LocalDate.of(2026, 10, 26);
        capacidadDiaRepository.save(new CapacidadDia(senderoId, lunes.plusDays(1), 25, (short) 80, adminId));
        capacidadDiaRepository.save(new CapacidadDia(senderoId, lunes, 30, (short) 80, adminId));
        capacidadDiaRepository.save(new CapacidadDia(senderoId, lunes.plusDays(10), 20, (short) 80, adminId));

        assertThat(capacidadDiaRepository.findByFechaBetweenOrderByFechaAscSenderoIdAsc(lunes, lunes.plusDays(6)))
                .extracting(CapacidadDia::getFecha)
                .containsExactly(lunes, lunes.plusDays(1));
        assertThat(capacidadDiaRepository.findBySenderoIdAndFechaConBloqueo(senderoId, lunes))
                .get()
                .extracting(CapacidadDia::getCupoMaximo)
                .isEqualTo(30);
    }

    @Test
    void noPermiteDosRegistrosParaElMismoSenderoYDia() {
        Long senderoId = unSendero().getId();
        UUID adminId = unAdministrador().getId();
        LocalDate dia = LocalDate.of(2026, 10, 28);
        capacidadDiaRepository.saveAndFlush(new CapacidadDia(senderoId, dia, 30, (short) 80, adminId));

        assertThatThrownBy(() -> capacidadDiaRepository.saveAndFlush(new CapacidadDia(senderoId, dia, 10, (short) 80, adminId)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Sendero unSendero() {
        return senderoRepository.save(new Sendero(
                "Sendero capacidad " + UUID.randomUUID(), null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("30000")));
    }

    private Usuario unAdministrador() {
        return usuarioRepository.save(new Usuario(
                "admin-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR));
    }
}
