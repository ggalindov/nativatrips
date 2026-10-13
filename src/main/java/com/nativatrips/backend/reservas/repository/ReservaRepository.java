package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    List<Reserva> findByTuristaIdOrderByFechaTourDesc(UUID turistaId);

    List<Reserva> findByEstadoOrderByCreatedAtAsc(EstadoReserva estado);

    List<Reserva> findByGuiaIdOrderByFechaTourAsc(UUID guiaId);

    List<Reserva> findByGuiaIdAndFechaTourOrderByFechaTourAsc(UUID guiaId, LocalDate fechaTour);

    @Query("""
            SELECT COALESCE(SUM(r.cantidadPersonas), 0) FROM Reserva r
            WHERE r.senderoId = :senderoId
              AND r.fechaTour = :fechaTour
              AND r.estado IN :estadosActivos
            """)
    int sumarPersonasActivas(
            @Param("senderoId") Long senderoId,
            @Param("fechaTour") LocalDate fechaTour,
            @Param("estadosActivos") List<EstadoReserva> estadosActivos);

    List<Reserva> findByEstadoAndBloqueoExpiraEnBefore(EstadoReserva estado, Instant instante);
}
