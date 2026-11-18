package com.nativatrips.backend.common.correo;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class TextosCorreoTest {

    private static Properties cargar(String archivo) throws IOException {
        Properties propiedades = new Properties();
        try (InputStream entrada = TextosCorreoTest.class.getResourceAsStream("/i18n/" + archivo)) {
            assertThat(entrada).as(archivo).isNotNull();
            propiedades.load(new InputStreamReader(entrada, StandardCharsets.UTF_8));
        }
        return propiedades;
    }

    @ParameterizedTest
    @ValueSource(strings = {"correos_en.properties", "correos_fr.properties", "correos_pt.properties"})
    void cadaIdiomaTieneExactamenteLasMismasClavesQueElEspanol(String archivo) throws IOException {
        assertThat(cargar(archivo).stringPropertyNames()).isEqualTo(cargar("correos.properties").stringPropertyNames());
    }

    @ParameterizedTest
    @ValueSource(strings = {"es", "en", "fr", "pt"})
    void ningunTextoQuedaConMarcadoresSinReemplazarNiConComillasRotas(String idioma) throws IOException {
        for (String clave : cargar("correos.properties").stringPropertyNames()) {
            String resultado = TextosCorreo.texto(idioma, clave, "A", "B", "C", "D", "E", "F", "G");
            assertThat(resultado).as(idioma + " " + clave).doesNotContain("{").doesNotContain("}").isNotBlank();
        }
    }

    @Test
    void elEspanolConservaElTextoDeSiempre() {
        assertThat(TextosCorreo.texto("es", "cupo.asunto", "NT-7Q4KX2")).isEqualTo("Tu cupo esta apartado - NativaTrips NT-7Q4KX2");
        assertThat(TextosCorreo.texto("es", "cupo.cuerpo", "Laura", 2, "Lagunas de Siecha", "2026-11-28", "NT-7Q4KX2",
                "10:15", "https://nativatrips.co/mi-reserva/abc"))
                .isEqualTo("Hola Laura. Apartamos 2 cupo(s) en Lagunas de Siecha para el 2026-11-28. Tu codigo de reserva"
                        + " es NT-7Q4KX2. El cupo se guarda hasta las 10:15 (hora de Colombia) mientras completas el pago."
                        + "\n\nDesde este enlace pagas, registras a tus acompanantes y consultas tu reserva:\n"
                        + "https://nativatrips.co/mi-reserva/abc"
                        + "\n\nEs personal: no lo compartas. Si lo pierdes, pide uno nuevo con tu correo y el codigo.");
    }

    @Test
    void cadaIdiomaTieneSuTextoYLosNumerosNoLlevanSeparadorDeMiles() {
        assertThat(TextosCorreo.texto("en", "cupo.asunto", "NT-1")).isEqualTo("Your spot is on hold - NativaTrips NT-1");
        assertThat(TextosCorreo.texto("fr", "cupo.asunto", "NT-1")).isEqualTo("Votre place est réservée - NativaTrips NT-1");
        assertThat(TextosCorreo.texto("pt", "cupo.asunto", "NT-1")).isEqualTo("Sua vaga está reservada - NativaTrips NT-1");
        assertThat(TextosCorreo.texto("en", "comprobante.personas", 1200)).isEqualTo("People: 1200");
    }

    @Test
    void unIdiomaNoSoportadoUsaElEspanol() {
        assertThat(TextosCorreo.texto("de", "historial.asunto")).isEqualTo("Tus reservas en NativaTrips");
    }
}
