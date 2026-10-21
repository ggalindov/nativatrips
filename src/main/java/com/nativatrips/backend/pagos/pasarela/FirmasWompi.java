package com.nativatrips.backend.pagos.pasarela;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Firmas que exige Wompi (ADR-005), ambas SHA-256 en hexadecimal:
 * <ul>
 *   <li>integridad del checkout: referencia + montoEnCentavos + moneda + [fechaExpiracion] + secretoDeIntegridad;</li>
 *   <li>checksum de un evento: valores de signature.properties en orden + timestamp + secretoDeEventos.</li>
 * </ul>
 */
public final class FirmasWompi {

    private FirmasWompi() {
    }

    public static String integridad(
            String referencia, long montoEnCentavos, String moneda, String fechaExpiracion, String secretoIntegridad) {
        return sha256(referencia + montoEnCentavos + moneda + (fechaExpiracion == null ? "" : fechaExpiracion)
                + secretoIntegridad);
    }

    public static String checksumEvento(String valoresConcatenados, long timestamp, String secretoEventos) {
        return sha256(valoresConcatenados + timestamp + secretoEventos);
    }

    /** Comparacion en tiempo constante, sin importar mayusculas (Wompi envia el checksum en mayusculas). */
    public static boolean coinciden(String esperado, String recibido) {
        if (esperado == null || recibido == null) {
            return false;
        }
        return MessageDigest.isEqual(
                esperado.toLowerCase().getBytes(StandardCharsets.US_ASCII),
                recibido.toLowerCase().getBytes(StandardCharsets.US_ASCII));
    }

    private static String sha256(String texto) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 no esta disponible en la JVM", ex);
        }
    }
}
