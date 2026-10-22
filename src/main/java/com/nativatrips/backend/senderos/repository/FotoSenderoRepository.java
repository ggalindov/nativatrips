package com.nativatrips.backend.senderos.repository;

import com.nativatrips.backend.senderos.model.FotoSendero;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FotoSenderoRepository extends JpaRepository<FotoSendero, UUID> {

    List<FotoSendero> findBySenderoIdOrderByOrdenAsc(Long senderoId);

    List<FotoSendero> findBySenderoIdInOrderByOrdenAsc(Collection<Long> senderoIds);

    int countBySenderoId(Long senderoId);
}
