package com.nativatrips.backend.pagos.pasarela;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** Vectores calculados con las cadenas de ejemplo de la documentacion de Wompi. */
class FirmasWompiTest {

    @Test
    void firmaDeIntegridadConFechaDeExpiracion() {
        assertThat(FirmasWompi.integridad(
                        "sk8-438k4-xmxm392-sn2m", 2_490_000, "COP", "2023-06-09T20:28:50.000Z",
                        "test_integrity_Z5ZY1UenvLLZaQ8tGfMEkr8YRe6Xd5zC"))
                .isEqualTo("aa6621ada92c0ef994e31b87e60462abec770cf1206f6d829d23c7428c204b6c");
    }

    @Test
    void checksumDeUnEvento() {
        assertThat(FirmasWompi.checksumEvento(
                        "1234-1610641025-49201" + "APPROVED" + "4490000", 1_530_291_411L,
                        "prod_events_OcHnnaSaUM4zGQMcFvLsX5MQSDzSmI6Q"))
                .isEqualTo("e0769077f89d7a72bfd94acb3d48801694ed802bcc5f120400fbd9aaf67f70da");
    }

    @Test
    void laComparacionNoDistingueMayusculasNiAceptaNulos() {
        assertThat(FirmasWompi.coinciden("abc123", "ABC123")).isTrue();
        assertThat(FirmasWompi.coinciden("abc123", "abc124")).isFalse();
        assertThat(FirmasWompi.coinciden("abc123", null)).isFalse();
    }
}
