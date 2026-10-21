package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.ReservaIntegrante;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaIntegranteRepository extends JpaRepository<ReservaIntegrante, UUID> {

    List<ReservaIntegrante> findByReservaId(UUID reservaId);

    /** RF-11: salidas completadas a las que asistio el mismo documento, sin contar la reserva actual. */
    @Query("""
            select count(distinct r.id) from ReservaIntegrante i, Reserva r
            where r.id = i.reservaId and i.tipoDocumento = :tipo and i.documentoIdentidad = :documento
              and r.estado = :completada and (i.asistio is null or i.asistio = true) and r.id <> :reservaActual
            """)
    long contarVisitasPrevias(
            @Param("tipo") TipoDocumento tipo,
            @Param("documento") String documento,
            @Param("reservaActual") UUID reservaActual,
            @Param("completada") EstadoReserva completada);
}
