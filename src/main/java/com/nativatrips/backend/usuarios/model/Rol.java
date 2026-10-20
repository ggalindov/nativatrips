package com.nativatrips.backend.usuarios.model;

/**
 * Roles con cuenta (ADR-007). El administrador reune administracion y gerencia; la Autoridad
 * Ambiental no tiene cuenta y recibe sus reportes a traves del administrador. TURISTA se retira
 * cuando la reserva sin cuenta reemplace al registro de turistas (ADR-004).
 */
public enum Rol {
    TURISTA,
    ADMINISTRADOR,
    GUIA_TURISTICO
}
