package com.nativatrips.backend.capacidad.repository;

import com.nativatrips.backend.capacidad.model.CapacidadDia;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CapacidadDiaRepository extends JpaRepository<CapacidadDia, Long> {

    Optional<CapacidadDia> findBySenderoIdAndFecha(Long senderoId, LocalDate fecha);

    List<CapacidadDia> findByFechaBetweenOrderByFechaAscSenderoIdAsc(LocalDate desde, LocalDate hasta);

    List<CapacidadDia> findBySenderoIdAndFechaBetweenOrderByFechaAsc(Long senderoId, LocalDate desde, LocalDate hasta);

    /** SELECT ... FOR UPDATE del dia: otra reserva para el mismo sendero y fecha espera (ADR-008). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CapacidadDia c WHERE c.senderoId = :senderoId AND c.fecha = :fecha")
    Optional<CapacidadDia> findBySenderoIdAndFechaConBloqueo(
            @Param("senderoId") Long senderoId, @Param("fecha") LocalDate fecha);
}
