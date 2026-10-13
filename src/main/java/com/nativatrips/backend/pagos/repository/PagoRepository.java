package com.nativatrips.backend.pagos.repository;

import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, UUID> {

    Optional<Pago> findByReferenciaPayu(String referenciaPayu);

    List<Pago> findByReservaIdOrderByCreatedAtDesc(UUID reservaId);

    Optional<Pago> findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(UUID reservaId, EstadoPago estado);
}
