package com.nativatrips.backend.reservas.model;

/** Documentos con los que se ingresa al parque; los mismos que ofrece el frontend. */
public enum TipoDocumento {
    CC,
    TI,
    CE,
    PPT,
    PASAPORTE,
    DNI;

    /** Cedula y tarjeta de identidad son de colombianos; los demas, de extranjeros. */
    public boolean esNacional() {
        return this == CC || this == TI;
    }

    /** Pasaporte y DNI pueden tener letras; los demas son solo numeros. */
    public boolean esAlfanumerico() {
        return this == PASAPORTE || this == DNI;
    }
}
