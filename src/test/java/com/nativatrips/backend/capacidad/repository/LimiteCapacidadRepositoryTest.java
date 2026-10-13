package com.nativatrips.backend.capacidad.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
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
class LimiteCapacidadRepositoryTest {

    @Autowired
    private LimiteCapacidadRepository limiteCapacidadRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Test
    void encuentraElLimiteVigenteParaUnaFechaDentroDeLaTemporada() {
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero de prueba", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, new BigDecimal("10000")));

        limiteCapacidadRepository.save(new LimiteCapacidad(
                sendero.getId(),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 3, 31),
                50,
                (short) 80,
                null,
                "Autoridad Ambiental - CAR"));

        var vigente = limiteCapacidadRepository.findVigentePara(sendero.getId(), LocalDate.of(2026, 2, 15));
        var fueraDeTemporada = limiteCapacidadRepository.findVigentePara(sendero.getId(), LocalDate.of(2026, 6, 1));

        assertThat(vigente).isPresent();
        assertThat(vigente.get().getCupoMaximoDia()).isEqualTo(50);
        assertThat(fueraDeTemporada).isEmpty();
    }
}
