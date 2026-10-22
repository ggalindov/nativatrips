package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EstadoSolicitudReprogramacion;
import com.nativatrips.backend.reservas.model.SolicitudReprogramacion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitudReprogramacionRepository extends JpaRepository<SolicitudReprogramacion, UUID> {

    List<SolicitudReprogramacion> findByEstadoOrderByCreatedAtAsc(EstadoSolicitudReprogramacion estado);

    Optional<SolicitudReprogramacion> findFirstByReservaIdOrderByCreatedAtDesc(UUID reservaId);

    boolean existsByReservaIdAndEstado(UUID reservaId, EstadoSolicitudReprogramacion estado);
}
