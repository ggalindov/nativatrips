package com.nativatrips.backend.reservas.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class GeneradorCodigoReservaTest {

    private final GeneradorCodigoReserva generador = new GeneradorCodigoReserva();

    @Test
    void elCodigoEsNtYSeisCaracteresSinLosQueSeConfunden() {
        for (int i = 0; i < 1_000; i++) {
            assertThat(generador.generar()).matches("NT-[2-9A-HJKMNP-Z]{6}").doesNotContain("0", "O", "1", "I", "L");
        }
    }

    @Test
    void milCodigosSeguidosNoSeRepiten() {
        Set<String> codigos = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            codigos.add(generador.generar());
        }
        assertThat(codigos).hasSize(1_000);
    }
}
