package com.nativatrips.backend.senderos.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class SenderoRepositoryTest {

    @Autowired
    private SenderoRepository senderoRepository;

    @Test
    void listaSoloSenderosActivos() {
        Sendero activo = senderoRepository.save(new Sendero(
                "Sendero Piedras Gordas",
                "Recorrido por el paramo",
                NivelDificultad.MODERADO,
                180,
                "ECOTURISMO",
                "Botas de trekking",
                new BigDecimal("50000")));

        Sendero inactivo = senderoRepository.save(new Sendero(
                "Sendero Cerrado",
                "Fuera de servicio",
                NivelDificultad.FACIL,
                60,
                "ECOTURISMO",
                null,
                new BigDecimal("0")));
        inactivo.setActivo(false);

        senderoRepository.saveAndFlush(inactivo);

        var activos = senderoRepository.findByActivoTrue();

        assertThat(activos).extracting(Sendero::getId).containsExactly(activo.getId());
        assertThat(activos.get(0).getCreatedAt()).isNotNull();
    }
}
