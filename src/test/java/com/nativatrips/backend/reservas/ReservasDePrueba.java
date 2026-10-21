package com.nativatrips.backend.reservas;

import com.nativatrips.backend.reservas.model.Reserva;
import com.nativatrips.backend.reservas.model.TipoDocumento;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.model.TitularReserva;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Reservas sin cuenta listas para las pruebas, con un titular de ejemplo. */
public final class ReservasDePrueba {

    private ReservasDePrueba() {
    }

    public static TitularReserva titular() {
        return new TitularReserva("Laura Gomez", TipoDocumento.CC, "1020304050", "CO", "laura@example.com", "57", "3001234567");
    }

    public static Reserva reserva(Long senderoId, LocalDate fecha, int personas, Instant bloqueoExpiraEn) {
        return reserva(senderoId, fecha, personas, TipoGrupo.ESTANDAR, bloqueoExpiraEn);
    }

    public static Reserva reserva(Long senderoId, LocalDate fecha, int personas, TipoGrupo tipo, Instant bloqueoExpiraEn) {
        return Reserva.sinCuenta(
                senderoId, fecha, personas, tipo,
                tipo == TipoGrupo.NECESIDAD_ESPECIAL ? "Silla de ruedas" : null,
                bloqueoExpiraEn,
                "NT-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(),
                titular());
    }
}
