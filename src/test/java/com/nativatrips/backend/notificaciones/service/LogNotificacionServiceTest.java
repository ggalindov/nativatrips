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
}
