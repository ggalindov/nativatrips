package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EnlaceHistorial;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnlaceHistorialRepository extends JpaRepository<EnlaceHistorial, UUID> {

    Optional<EnlaceHistorial> findByTokenHash(String tokenHash);
}
