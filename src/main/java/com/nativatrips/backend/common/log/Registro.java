package com.nativatrips.backend.common.log;

/** Ayudas para escribir en el registro valores que llegan de fuera sin que puedan falsificar lineas. */
public final class Registro {

    private Registro() {
    }

    /** Cambia los saltos de linea por guion bajo; un valor nulo se devuelve igual. */
    public static String limpio(String valor) {
        if (valor == null) {
            return null;
        }
        return valor.replace("\r", "_").replace("\n", "_");
    }
}
