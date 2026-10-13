package com.nativatrips.backend.pagos.repository;

import com.nativatrips.backend.pagos.model.PagoEstadoHistorial;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoEstadoHistorialRepository extends JpaRepository<PagoEstadoHistorial, UUID> {
}
