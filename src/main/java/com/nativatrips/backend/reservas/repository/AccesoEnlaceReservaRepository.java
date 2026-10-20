package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.AccesoEnlaceReserva;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccesoEnlaceReservaRepository extends JpaRepository<AccesoEnlaceReserva, UUID> {

    List<AccesoEnlaceReserva> findByEnlaceIdOrderByCreatedAtAsc(UUID enlaceId);
}
