# ADR-007 — Dos roles de personal: administrador y guía

- **Estado:** aceptada
- **Fecha:** 2026-10-20
- **Decisores:** Juan David Galindo Calderón, Gonzalo Alberto Ayala Almeciga

## Contexto

El backend nació con cuatro roles (`TURISTA`, `PERSONAL_ADMINISTRATIVO`, `GUIA_TURISTICO` y
`GERENCIA`), tomados del análisis de interesados del documento de grado. En la operación real de
Eco Palacio la misma persona administra las reservas y revisa los indicadores: separar
administración y gerencia duplica permisos, pantallas y pruebas sin aportar control.

Además, ADR-004 decidió que el turista no tiene cuenta: reserva como invitado y gestiona su
reserva con un enlace mágico.

## Decisión

1. El personal tiene **dos roles**: `ADMINISTRADOR` (reservas, capacidad, senderos, cuentas,
   indicadores y reportes) y `GUIA_TURISTICO` (agenda, lista del grupo y asistencia).
2. Una migración convierte `PERSONAL_ADMINISTRATIVO` y `GERENCIA` en `ADMINISTRADOR`, sin perder
   cuentas ni historial.
3. `TURISTA` se conserva mientras exista el flujo de reserva con cuenta y se retira cuando entre
   la reserva sin cuenta (S3-12 del plan).

## Consecuencias

- Los `@PreAuthorize` pasan de `hasAnyRole('PERSONAL_ADMINISTRATIVO', 'GERENCIA')` a
  `hasRole('ADMINISTRADOR')`.
- Los tokens emitidos antes de la migración con un rol retirado dejan de ser válidos: el equipo
  vuelve a iniciar sesión una vez.
- Se actualizan la matriz de permisos, RF-32, RNF-07, CU-12 y HU-12 del documento de grado.
- Si en el futuro se necesita separar permisos, se agrega un rol nuevo con su migración; el
  modelo de un rol por cuenta se mantiene.
