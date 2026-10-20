package com.nativatrips.backend.usuarios.repository;

import com.nativatrips.backend.usuarios.model.PasswordResetToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /** El parametro es el hash SHA-256 del token, nunca el token que viaja en el enlace. */
    Optional<PasswordResetToken> findByToken(String token);

    List<PasswordResetToken> findByUsuarioIdAndUsadoFalse(UUID usuarioId);
}
