package com.nativatrips.backend.reservas.service;

import com.nativatrips.backend.capacidad.service.OcupacionDelDia;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

/** Implementa el puerto de la capacidad con las reservas que ocupan cupo. */
@Component
class OcupacionReservas implements OcupacionDelDia {

    private final ReservaRepository reservaRepository;

    OcupacionReservas(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    @Override
    public int personasReservadas(Long senderoId, LocalDate fecha) {
        return reservaRepository.sumarPersonasActivas(senderoId, fecha, EstadoReserva.queOcupanCupo());
    }
}
