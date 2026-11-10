package com.nativatrips.backend.common.log;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RegistroTest {

    @Test
    void losSaltosDeLineaNoPuedenPartirUnaLineaDelRegistro() {
        assertThat(Registro.limpio("tx-1\r\nERROR falso\nsegunda")).isEqualTo("tx-1__ERROR falso_segunda");
    }

    @Test
    void unValorNormalOUnoNuloNoCambian() {
        assertThat(Registro.limpio("11111-1700000000-12345")).isEqualTo("11111-1700000000-12345");
        assertThat(Registro.limpio(null)).isNull();
    }
}
