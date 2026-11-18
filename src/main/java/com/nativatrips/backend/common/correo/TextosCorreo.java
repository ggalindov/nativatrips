package com.nativatrips.backend.common.correo;

import java.util.Arrays;
import org.springframework.context.support.ResourceBundleMessageSource;

/**
 * Textos de los correos al turista en su idioma (RF-41), desde {@code i18n/correos*.properties}.
 * Los datos se pasan como texto para que MessageFormat no les ponga separadores de miles ni
 * formatos propios del idioma: las fechas, horas y valores llegan ya formateados.
 */
public final class TextosCorreo {

    private static final ResourceBundleMessageSource MENSAJES = crear();

    private TextosCorreo() {
    }

    private static ResourceBundleMessageSource crear() {
        ResourceBundleMessageSource mensajes = new ResourceBundleMessageSource();
        mensajes.setBasename("i18n/correos");
        mensajes.setDefaultEncoding("UTF-8");
        // Sin esto, un idioma sin archivo caeria en el del sistema operativo y no en espanol.
        mensajes.setFallbackToSystemLocale(false);
        mensajes.setAlwaysUseMessageFormat(true);
        return mensajes;
    }

    public static String texto(String idioma, String clave, Object... datos) {
        Object[] comoTexto = Arrays.stream(datos).map(d -> d == null ? "" : String.valueOf(d)).toArray();
        return MENSAJES.getMessage(clave, comoTexto, Idioma.locale(idioma));
    }
}
