package com.nativatrips.backend.reservas.model;

/** Anexo 16, tabla 10: las unicas causales que permiten reprogramar una reserva confirmada. */
public enum CausalReprogramacion {
    /** Certificado medico o incapacidad expedida por una entidad de salud. */
    INCAPACIDAD_MEDICA,
    /** Registro civil de defuncion de un familiar en primer grado de consanguinidad. */
    FALLECIMIENTO_FAMILIAR,
    /** Soporte pertinente al caso; la evalua la gerencia, que hoy es el administrador (ADR-007). */
    FUERZA_MAYOR
}
