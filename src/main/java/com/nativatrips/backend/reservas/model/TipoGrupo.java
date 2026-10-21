package com.nativatrips.backend.reservas.model;

public enum TipoGrupo {
    ESTANDAR,
    GRUPO_CORPORATIVO,
    NECESIDAD_ESPECIAL;

    /** RF-09: estos grupos no pasan directo a pago, los aprueba el administrador. */
    public boolean requiereRevision() {
        return this != ESTANDAR;
    }
}
