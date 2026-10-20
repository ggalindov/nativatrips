package com.nativatrips.backend.usuarios.repository;

import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    /** SELECT ... FOR UPDATE: dos intentos simultaneos sobre la misma cuenta cuentan los dos (A-04). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.email = :email")
    Optional<Usuario> findByEmailConBloqueo(@Param("email") String email);

    boolean existsByEmail(String email);

    List<Usuario> findByRolAndActivoTrue(Rol rol);
}
