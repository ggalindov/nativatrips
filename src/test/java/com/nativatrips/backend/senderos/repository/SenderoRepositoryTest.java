package com.nativatrips.backend.senderos.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.senderos.model.FichaTecnica;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class SenderoRepositoryTest {

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void guardaLaFichaTecnicaYLosDestacadosEnOrden() {
        Sendero sendero = new Sendero(
                "Sendero Lagunas", null, NivelDificultad.EXIGENTE, 420, "ECOTURISMO", null, new BigDecimal("70000"));
        sendero.setFicha(new FichaTecnica(new BigDecimal("12.4"), 900, 3700, "Siecha", LocalTime.of(6, 30), "Portería"));
        sendero.reemplazarDestacados(List.of("Laguna de Siecha", "Frailejonales", "Mirador"));
        Long id = senderoRepository.saveAndFlush(sendero).getId();
        entityManager.clear();

        Sendero leido = senderoRepository.findById(id).orElseThrow();

        assertThat(leido.getNivelDificultad()).isEqualTo(NivelDificultad.EXIGENTE);
        assertThat(leido.getFicha().altitudMaxM()).isEqualTo(3700);
        assertThat(leido.getFicha().horaSalida()).isEqualTo(LocalTime.of(6, 30));
        assertThat(leido.getDestacados()).containsExactly("Laguna de Siecha", "Frailejonales", "Mirador");
    }

    @Test
    void unSenderoSinFichaSaleALasSiete() {
        Long id = senderoRepository.saveAndFlush(new Sendero(
                "Sendero sin ficha", null, NivelDificultad.FACIL, 60, "ECOTURISMO", null, BigDecimal.ZERO)).getId();
        entityManager.clear();

        assertThat(senderoRepository.findById(id).orElseThrow().getFicha().horaSalida()).isEqualTo(LocalTime.of(7, 0));
    }

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
