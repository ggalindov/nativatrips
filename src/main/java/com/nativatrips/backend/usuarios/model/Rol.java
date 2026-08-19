package com.nativatrips.backend.usuarios.model;

/**
 * Los 4 roles del sistema (analisis de stakeholders, Anexo 2). La Autoridad Ambiental
 * no tiene login propio: actua a traves de PERSONAL_ADMINISTRATIVO.
 */
public enum Rol {
    TURISTA,
    PERSONAL_ADMINISTRATIVO,
    GUIA_TURISTICO,
    GERENCIA
}
