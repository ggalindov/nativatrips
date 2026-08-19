package com.nativatrips.backend.senderos.repository;

import com.nativatrips.backend.senderos.model.Sendero;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SenderoRepository extends JpaRepository<Sendero, Long> {

    List<Sendero> findByActivoTrue();
}
