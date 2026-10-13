package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaIntegranteRepository extends JpaRepository<ReservaIntegrante, UUID> {

    List<ReservaIntegrante> findByReservaId(UUID reservaId);
}
