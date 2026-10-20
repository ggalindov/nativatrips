package com.nativatrips.backend.usuarios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nativatrips.backend.TestcontainersConfiguration;
import java.util.UUID;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * V6 (ADR-007): aplica las migraciones hasta V5 en un esquema aparte, carga cuentas con los roles
 * anteriores y comprueba que V6 las convierte sin perder ninguna.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class MigracionRolesTest {

    private static final String ESQUEMA = "migracion_roles";

    @Autowired
    private DataSource dataSource;

    @Test
    void unificaAdministracionYGerenciaEnAdministradorSinPerderCuentas() {
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(ESQUEMA)
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();
        Flyway.configure().configuration(flyway.getConfiguration()).target("5").load().migrate();

        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        insertarUsuario(jdbc, "admin@ecopalacio.co", "PERSONAL_ADMINISTRATIVO");
        insertarUsuario(jdbc, "gerencia@ecopalacio.co", "GERENCIA");
        insertarUsuario(jdbc, "guia@ecopalacio.co", "GUIA_TURISTICO");
        insertarUsuario(jdbc, "turista@example.com", "TURISTA");

        flyway.migrate();

        assertThat(rolDe(jdbc, "admin@ecopalacio.co")).isEqualTo("ADMINISTRADOR");
        assertThat(rolDe(jdbc, "gerencia@ecopalacio.co")).isEqualTo("ADMINISTRADOR");
        assertThat(rolDe(jdbc, "guia@ecopalacio.co")).isEqualTo("GUIA_TURISTICO");
        assertThat(rolDe(jdbc, "turista@example.com")).isEqualTo("TURISTA");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM " + ESQUEMA + ".usuarios", Integer.class)).isEqualTo(4);

        assertThatThrownBy(() -> insertarUsuario(jdbc, "nuevo@ecopalacio.co", "GERENCIA"))
                .as("el rol retirado ya no se acepta")
                .isInstanceOf(DataIntegrityViolationException.class);

        flyway.clean();
    }

    private static void insertarUsuario(JdbcTemplate jdbc, String email, String rol) {
        jdbc.update(
                "INSERT INTO " + ESQUEMA + ".usuarios (id, email, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?, ?)",
                UUID.randomUUID(), email, "hash", "Cuenta de prueba", rol);
    }

    private static String rolDe(JdbcTemplate jdbc, String email) {
        return jdbc.queryForObject("SELECT rol FROM " + ESQUEMA + ".usuarios WHERE email = ?", String.class, email);
    }
}
