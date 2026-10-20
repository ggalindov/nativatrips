package com.nativatrips.backend.pagos.repository;

import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.model.Pago;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PagoRepository extends JpaRepository<Pago, UUID> {

    Optional<Pago> findByReferencia(String referencia);

    /** SELECT ... FOR UPDATE: dos copias simultaneas del mismo evento se aplican una tras otra. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Pago p WHERE p.referencia = :referencia")
    Optional<Pago> findByReferenciaConBloqueo(@Param("referencia") String referencia);

    List<Pago> findByReservaIdOrderByCreatedAtDesc(UUID reservaId);

    long countByReservaIdAndEstadoIn(UUID reservaId, List<EstadoPago> estados);

    Optional<Pago> findFirstByReservaIdAndEstadoOrderByCreatedAtDesc(UUID reservaId, EstadoPago estado);
}
