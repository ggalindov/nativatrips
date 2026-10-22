package com.nativatrips.backend.reservas.repository;

import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.Reserva;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaRepository extends JpaRepository<Reserva, UUID> {

    boolean existsByCodigoReserva(String codigoReserva);

    Optional<Reserva> findByCodigoReserva(String codigoReserva);

    List<Reserva> findByEstadoOrderByCreatedAtAsc(EstadoReserva estado);

    List<Reserva> findByFechaTourBetweenOrderByFechaTourAscCreatedAtAsc(LocalDate desde, LocalDate hasta);

    List<Reserva> findByGuiaIdOrderByFechaTourAsc(UUID guiaId);

    /** RF-36: historial de un correo, lo mas reciente primero. */
    List<Reserva> findByTitularCorreoOrderByFechaTourDesc(String correo);

    boolean existsByTitularCorreo(String correo);

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

    @Query("""
            SELECT COUNT(r) FROM Reserva r
            WHERE r.senderoId = :senderoId AND r.fechaTour >= :desde AND r.estado IN :estados
            """)
    long contarDesde(
            @Param("senderoId") Long senderoId,
            @Param("desde") LocalDate desde,
            @Param("estados") List<EstadoReserva> estados);

    List<Reserva> findByEstadoAndBloqueoExpiraEnBefore(EstadoReserva estado, Instant instante);

    /** RF-10: reservas confirmadas con tour en la ventana del aviso previo que aun no lo recibieron. */
    List<Reserva> findByEstadoAndFechaTourBetweenAndAvisoPrevioEnviadoEnIsNull(
            EstadoReserva estado, LocalDate desde, LocalDate hasta);
}
