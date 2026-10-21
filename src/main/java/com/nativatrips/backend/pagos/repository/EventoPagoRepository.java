package com.nativatrips.backend.pagos.repository;

import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.EventoPago;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoPagoRepository extends JpaRepository<EventoPago, UUID> {

    boolean existsByTransaccionIdAndEstado(String transaccionId, EstadoPago estado);

    List<EventoPago> findByPagoId(UUID pagoId);
}
