package com.nativatrips.backend.common.seguridad;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Tokens que viajan en enlaces por correo (recuperar la clave, gestionar la reserva). El token
 * tiene 256 bits al azar; en la base solo se guarda su hash SHA-256, asi quien lea la tabla no
 * puede usarlo.
 */
public final class TokenSeguro {

    private static final SecureRandom AZAR = new SecureRandom();

    private TokenSeguro() {
    }

    /** 32 bytes al azar en Base64 para URL (43 caracteres). */
    public static String generar() {
        byte[] bytes = new byte[32];
        AZAR.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 no esta disponible en la JVM", ex);
        }
    }
}
