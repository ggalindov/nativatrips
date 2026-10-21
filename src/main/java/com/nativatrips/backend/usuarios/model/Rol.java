package com.nativatrips.backend.usuarios.model;

/**
 * Roles con cuenta (ADR-007): solo el equipo. El administrador reune administracion y gerencia; la
 * Autoridad Ambiental no tiene cuenta y recibe sus reportes a traves del administrador. El turista
 * reserva sin cuenta y gestiona su reserva con el enlace magico (ADR-004).
 */
public enum Rol {
    ADMINISTRADOR,
    GUIA_TURISTICO
}
