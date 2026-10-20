package com.nativatrips.backend.asistente.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class LimiteMensajesAsistenteTest {

    /** Reloj que la prueba adelanta a mano. */
    private static final class RelojManual extends Clock {
        private Instant ahora = Instant.parse("2026-10-20T14:00:00Z");

        void adelantar(Duration tiempo) {
            ahora = ahora.plus(tiempo);
        }

        @Override
        public Instant instant() {
            return ahora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zona) {
            return this;
        }
    }

    private final RelojManual reloj = new RelojManual();
    private final LimiteMensajesAsistente limite = new LimiteMensajesAsistente(3, reloj);

    @Test
    void aceptaHastaElMaximoYRechazaElSiguienteDentroDeLaHora() {
        assertThat(limite.permitir("190.1.1.1")).isTrue();
        assertThat(limite.permitir("190.1.1.1")).isTrue();
        assertThat(limite.permitir("190.1.1.1")).isTrue();

        assertThat(limite.permitir("190.1.1.1")).isFalse();
    }

    @Test
    void cadaVisitanteTieneSuPropioCupo() {
        for (int i = 0; i < 3; i++) {
            limite.permitir("190.1.1.1");
        }

        assertThat(limite.permitir("181.2.2.2")).isTrue();
    }

    @Test
    void laVentanaEsDeslizanteYLiberaElCupoMasViejoAlPasarUnaHora() {
        limite.permitir("190.1.1.1");
        reloj.adelantar(Duration.ofMinutes(30));
        limite.permitir("190.1.1.1");
        limite.permitir("190.1.1.1");
        assertThat(limite.permitir("190.1.1.1")).isFalse();

        reloj.adelantar(Duration.ofMinutes(31));

        assertThat(limite.permitir("190.1.1.1")).as("el primer mensaje ya salio de la ventana").isTrue();
        assertThat(limite.permitir("190.1.1.1")).isFalse();
    }

    @Test
    void laLimpiezaOlvidaALosVisitantesSinMensajesRecientes() {
        limite.permitir("190.1.1.1");
        reloj.adelantar(Duration.ofMinutes(20));
        limite.permitir("181.2.2.2");
        reloj.adelantar(Duration.ofMinutes(45));

        limite.limpiar();

        assertThat(limite.visitantesRegistrados()).isEqualTo(1);
    }
}
