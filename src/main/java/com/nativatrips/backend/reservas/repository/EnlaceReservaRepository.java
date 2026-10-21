package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EnlaceReserva;
import com.nativatrips.backend.reservas.model.PropositoEnlace;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnlaceReservaRepository extends JpaRepository<EnlaceReserva, UUID> {

    Optional<EnlaceReserva> findByTokenHash(String tokenHash);

    List<EnlaceReserva> findByReservaIdAndPropositoAndRevocadoEnIsNull(UUID reservaId, PropositoEnlace proposito);
}
