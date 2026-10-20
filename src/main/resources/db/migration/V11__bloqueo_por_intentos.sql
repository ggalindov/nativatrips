-- HU-14 (NAT-92), amenaza A-04: tras cinco intentos fallidos seguidos el acceso se bloquea
-- 15 minutos. El contador vuelve a cero con un inicio de sesion correcto o al restablecer la clave.

ALTER TABLE usuarios
    ADD COLUMN intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN bloqueado_hasta   TIMESTAMPTZ;
