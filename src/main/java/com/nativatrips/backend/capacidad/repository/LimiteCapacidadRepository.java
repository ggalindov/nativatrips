package com.nativatrips.backend.capacidad.repository;

import com.nativatrips.backend.capacidad.model.LimiteCapacidad;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LimiteCapacidadRepository extends JpaRepository<LimiteCapacidad, Long> {

    List<LimiteCapacidad> findBySenderoIdOrderByTemporadaInicio(Long senderoId);

    @Query("""
            SELECT lc FROM LimiteCapacidad lc
            WHERE lc.senderoId = :senderoId
              AND :fecha BETWEEN lc.temporadaInicio AND lc.temporadaFin
            """)
    Optional<LimiteCapacidad> findVigentePara(@Param("senderoId") Long senderoId, @Param("fecha") LocalDate fecha);
}
