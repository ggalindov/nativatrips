-- ADR-007: el personal queda con dos roles, ADMINISTRADOR y GUIA_TURISTICO.
-- PERSONAL_ADMINISTRATIVO y GERENCIA se unen en ADMINISTRADOR sin perder cuentas ni historial.
-- TURISTA se conserva hasta que entre la reserva sin cuenta (ADR-004).

ALTER TABLE usuarios DROP CONSTRAINT ck_usuarios_rol;

UPDATE usuarios
SET rol = 'ADMINISTRADOR', updated_at = now()
WHERE rol IN ('PERSONAL_ADMINISTRATIVO', 'GERENCIA');

ALTER TABLE usuarios
    ADD CONSTRAINT ck_usuarios_rol CHECK (rol IN ('TURISTA', 'ADMINISTRADOR', 'GUIA_TURISTICO'));

UPDATE reserva_estado_historial
SET origen = 'ADMINISTRADOR'
WHERE origen = 'PERSONAL_ADMINISTRATIVO';
