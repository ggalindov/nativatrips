-- RF-36 (decision del 21 de octubre): sin cuentas de turista, el historial se abre con un enlace
-- magico enviado al correo con el que se reservo. Muestra todas las reservas de ese correo y
-- vence en 24 horas. Como los demas enlaces, solo se guarda el hash del token.
CREATE TABLE enlaces_historial (
    id          UUID PRIMARY KEY,
    correo      VARCHAR(255) NOT NULL,
    token_hash  VARCHAR(64) NOT NULL,
    expira_en   TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_enlaces_historial_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_reservas_titular_correo ON reservas (titular_correo);
