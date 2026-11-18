package com.nativatrips.backend.common.correo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class IdiomaTest {

    @AfterEach
    void limpiar() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void tomaElPrimerIdiomaSoportadoDeLaCabecera() {
        assertThat(Idioma.normalizar("fr-FR,fr;q=0.9,en;q=0.8")).isEqualTo("fr");
        assertThat(Idioma.normalizar("en")).isEqualTo("en");
        assertThat(Idioma.normalizar("pt_BR")).isEqualTo("pt");
        assertThat(Idioma.normalizar("ES")).isEqualTo("es");
    }

    @Test
    void unIdiomaNoSoportadoOVacioQuedaEnEspanol() {
        assertThat(Idioma.normalizar("de-DE")).isEqualTo("es");
        assertThat(Idioma.normalizar("")).isEqualTo("es");
        assertThat(Idioma.normalizar(null)).isEqualTo("es");
    }

    @Test
    void enUnaPeticionUsaAcceptLanguageYSinCabeceraEspanol() {
        MockHttpServletRequest conCabecera = new MockHttpServletRequest();
        conCabecera.addHeader("Accept-Language", "pt");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(conCabecera));
        assertThat(Idioma.deLaSolicitud()).isEqualTo("pt");

        // MockHttpServletRequest trae ingles como idioma por defecto: sin cabecera no debe usarse.
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
        assertThat(Idioma.deLaSolicitud()).isEqualTo("es");
    }

    @Test
    void fueraDeUnaPeticionEsEspanol() {
        assertThat(Idioma.deLaSolicitud()).isEqualTo("es");
    }
}
