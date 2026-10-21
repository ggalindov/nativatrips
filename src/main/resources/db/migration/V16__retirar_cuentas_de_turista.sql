-- ADR-004 y decision 2: el turista ya no tiene cuenta. Se retira el rol TURISTA, el registro
-- publico y la reserva con cuenta; solo queda la reserva sin cuenta con enlace magico.
-- Las cuentas TURISTA solo existieron en desarrollo y pruebas. Sus reservas quedan como historico
-- (turista_id deja de apuntar a usuarios) y sus cambios de estado pierden el autor.

ALTER TABLE reservas DROP CONSTRAINT fk_reservas_turista;
COMMENT ON COLUMN reservas.turista_id IS 'Historico: cuenta TURISTA retirada en V16. Las reservas nuevas llevan titular.';

UPDATE reserva_estado_historial SET cambiado_por_usuario_id = NULL
WHERE cambiado_por_usuario_id IN (SELECT id FROM usuarios WHERE rol = 'TURISTA');

DELETE FROM usuarios WHERE rol = 'TURISTA';

ALTER TABLE usuarios DROP CONSTRAINT ck_usuarios_rol;
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_rol CHECK (rol IN ('ADMINISTRADOR', 'GUIA_TURISTICO'));
