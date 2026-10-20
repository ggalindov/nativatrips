package com.nativatrips.backend.reservas.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

/**
 * Codigo que el turista ve y dicta por telefono: NT- y seis caracteres sin los que se confunden
 * (0/O, 1/I/L). Son 31^6, unos 887 millones de combinaciones, y se genera con SecureRandom
 * para que no se pueda adivinar el siguiente.
 */
@Component
public class GeneradorCodigoReserva {

    static final String ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    static final int LONGITUD = 6;

    private final SecureRandom azar = new SecureRandom();

    public String generar() {
        StringBuilder codigo = new StringBuilder("NT-");
        for (int i = 0; i < LONGITUD; i++) {
            codigo.append(ALFABETO.charAt(azar.nextInt(ALFABETO.length())));
        }
        return codigo.toString();
    }
}
