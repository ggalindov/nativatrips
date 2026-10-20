package com.nativatrips.backend.usuarios.repository;

import com.nativatrips.backend.usuarios.model.TokenRevocado;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TokenRevocadoRepository extends JpaRepository<TokenRevocado, UUID> {

    @Modifying
    @Query("DELETE FROM TokenRevocado t WHERE t.expiraEn < :instante")
    int borrarVencidosAntesDe(@Param("instante") Instant instante);
}
