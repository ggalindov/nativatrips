package com.nativatrips.backend.usuarios.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.config.JpaConfig;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfiguration.class, JpaConfig.class})
class UsuarioRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void guardaYRecuperaUnUsuarioPorEmail() {
        Usuario turista = new Usuario(
                "turista@example.com",
                "hash-no-real-solo-de-prueba",
                "Turista de Prueba",
                Rol.TURISTA);

        usuarioRepository.save(turista);

        Usuario encontrado = usuarioRepository.findByEmail("turista@example.com").orElseThrow();

        assertThat(encontrado.getId()).isNotNull();
        assertThat(encontrado.getNombreCompleto()).isEqualTo("Turista de Prueba");
        assertThat(encontrado.getRol()).isEqualTo(Rol.TURISTA);
        assertThat(encontrado.isActivo()).isTrue();
        assertThat(encontrado.getCreatedAt()).isNotNull();
    }

    @Test
    void existsByEmailDistingueUsuariosExistentesYNoExistentes() {
        usuarioRepository.save(new Usuario(
                "admin@example.com",
                "hash-no-real-solo-de-prueba",
                "Admin de Prueba",
                Rol.PERSONAL_ADMINISTRATIVO));

        assertThat(usuarioRepository.existsByEmail("admin@example.com")).isTrue();
        assertThat(usuarioRepository.existsByEmail("no-existe@example.com")).isFalse();
    }
}
