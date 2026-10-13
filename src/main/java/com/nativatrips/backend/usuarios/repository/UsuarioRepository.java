package com.nativatrips.backend.usuarios.repository;

import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByRolAndActivoTrue(Rol rol);
}
