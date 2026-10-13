package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.ReservaEstadoHistorial;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservaEstadoHistorialRepository extends JpaRepository<ReservaEstadoHistorial, UUID> {

    List<ReservaEstadoHistorial> findByReservaIdOrderByCreatedAtAsc(UUID reservaId);
}
