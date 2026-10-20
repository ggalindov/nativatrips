package com.nativatrips.backend.common.seguridad;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TokenSeguroTest {

    @Test
    void elTokenTiene43CaracteresAptosParaUnaUrlYNoSeRepite() {
        Set<String> tokens = new HashSet<>();
        for (int i = 0; i < 1_000; i++) {
            String token = TokenSeguro.generar();
            assertThat(token).matches("[A-Za-z0-9_-]{43}");
            tokens.add(token);
        }
        assertThat(tokens).hasSize(1_000);
    }

    @Test
    void elHashEsSha256EnHexadecimal() {
        // Vector conocido: SHA-256("abc").
        assertThat(TokenSeguro.hash("abc")).isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }
}
