package com.nativatrips.backend.notificaciones.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class LogNotificacionServiceTest {

    @Test
    void enmascaraElCorreoDejandoLaPrimeraLetraYElDominio() {
        assertThat(LogNotificacionService.enmascarar("juana.perez@correo.co")).isEqualTo("j***@correo.co");
    }

    @Test
    void correoSinArrobaONuloQuedaOculto() {
        assertThat(LogNotificacionService.enmascarar("sin-arroba")).isEqualTo("***");
        assertThat(LogNotificacionService.enmascarar("@correo.co")).isEqualTo("***");
        assertThat(LogNotificacionService.enmascarar(null)).isEqualTo("***");
    }

    @Test
    void unDominioConSaltoDeLineaNoPuedeAbrirOtraLineaDelRegistro() {
        assertThat(LogNotificacionService.enmascarar("ana@correo.co\nINFO falso"))
                .isEqualTo("a***@correo.co_INFO falso")
                .doesNotContain("\n");
    }
}
