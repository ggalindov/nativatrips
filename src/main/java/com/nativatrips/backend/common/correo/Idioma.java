package com.nativatrips.backend.common.correo;

import java.util.Locale;
import java.util.Set;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Idiomas del portal (RF-41): espanol, ingles, frances y portugues. El idioma del turista llega en
 * Accept-Language, que el frontend envia con el idioma activo. Se lee directamente esa cabecera y
 * no el idioma por defecto del servidor, para que una peticion sin cabecera quede en espanol y no
 * en el idioma del sistema operativo del VPS.
 */
public final class Idioma {

    public static final String POR_DEFECTO = "es";
    private static final Set<String> SOPORTADOS = Set.of("es", "en", "fr", "pt");

    private Idioma() {
    }

    /** {@code "fr-FR,fr;q=0.9"} queda como {@code "fr"}; cualquier otro idioma o nada, como espanol. */
    public static String normalizar(String etiqueta) {
        if (etiqueta == null || etiqueta.isBlank()) {
            return POR_DEFECTO;
        }
        String primera = etiqueta.split(",")[0].split(";")[0].strip();
        String codigo = primera.split("[-_]")[0].toLowerCase(Locale.ROOT);
        return SOPORTADOS.contains(codigo) ? codigo : POR_DEFECTO;
    }

    /** Idioma de la peticion en curso; fuera de una peticion (tareas programadas), espanol. */
    public static String deLaSolicitud() {
        RequestAttributes atributos = RequestContextHolder.getRequestAttributes();
        if (atributos instanceof ServletRequestAttributes servlet) {
            return normalizar(servlet.getRequest().getHeader("Accept-Language"));
        }
        return POR_DEFECTO;
    }

    public static Locale locale(String idioma) {
        return Locale.forLanguageTag(normalizar(idioma));
    }
}
