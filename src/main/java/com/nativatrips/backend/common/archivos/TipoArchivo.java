package com.nativatrips.backend.common.archivos;

import java.util.Arrays;
import java.util.Optional;

/**
 * Tipos de archivo que acepta el sistema, reconocidos por su firma (los primeros bytes) y no por la
 * extension ni por el Content-Type que manda el navegador: un ejecutable renombrado a .jpg no pasa.
 */
public enum TipoArchivo {
    JPEG("image/jpeg", "jpg", new int[] {0xFF, 0xD8, 0xFF}),
    PNG("image/png", "png", new int[] {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}),
    WEBP("image/webp", "webp", null),
    PDF("application/pdf", "pdf", new int[] {0x25, 0x50, 0x44, 0x46, 0x2D});

    private final String mediaType;
    private final String extension;
    private final int[] firma;

    TipoArchivo(String mediaType, String extension, int[] firma) {
        this.mediaType = mediaType;
        this.extension = extension;
        this.firma = firma;
    }

    public String mediaType() {
        return mediaType;
    }

    public String extension() {
        return extension;
    }

    public boolean esImagen() {
        return this != PDF;
    }

    public static Optional<TipoArchivo> detectar(byte[] contenido) {
        return Arrays.stream(values()).filter(t -> t.coincide(contenido)).findFirst();
    }

    private boolean coincide(byte[] b) {
        if (this == WEBP) {
            // RIFF....WEBP
            return b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        }
        if (b.length < firma.length) {
            return false;
        }
        for (int i = 0; i < firma.length; i++) {
            if ((b[i] & 0xFF) != firma[i]) {
                return false;
            }
        }
        return true;
    }
}
