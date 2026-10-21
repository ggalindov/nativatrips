package com.nativatrips.backend.senderos;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/** El catalogo inicial carga los 13 senderos una sola vez y respeta lo que el administrador cambie. */
@Testcontainers(disabledWithoutDocker = true)
class SenderosInicialesTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(DockerImageName.parse("postgres:16-alpine"));

    @Test
    void cargaLosTreceSenderosSinDuplicarNiPisarCambios() throws Exception {
        migrar();
        assertThat(contar("SELECT count(*) FROM senderos")).isEqualTo(13);
        assertThat(contar("SELECT count(*) FROM senderos WHERE requisitos_ingreso IS NULL")).isZero();
        assertThat(contar("SELECT count(*) FROM sendero_destacados")).isGreaterThanOrEqualTo(39);

        ejecutar("UPDATE senderos SET precio = 99000 WHERE nombre = 'La Paila'");
        ejecutar("DELETE FROM flyway_schema_history WHERE type = 'SQL' AND version IS NULL");
        migrar();

        assertThat(contar("SELECT count(*) FROM senderos")).isEqualTo(13);
        assertThat(contar("SELECT precio::int FROM senderos WHERE nombre = 'La Paila'")).isEqualTo(99000);
    }

    private static void migrar() {
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration", "classpath:db/datos")
                .load()
                .migrate();
    }

    private static int contar(String sql) throws Exception {
        try (Connection c = conexion(); Statement s = c.createStatement(); ResultSet r = s.executeQuery(sql)) {
            r.next();
            return r.getInt(1);
        }
    }

    private static void ejecutar(String sql) throws Exception {
        try (Connection c = conexion(); Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    private static Connection conexion() throws Exception {
        return DriverManager.getConnection(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword());
    }
}
