-- RF-35: un sendero nuevo nace en borrador (el publico no lo ve) hasta que el administrador lo
-- publica; los que ya existen quedan publicados. Cada sendero tiene hasta 8 fotos, en orden.
ALTER TABLE senderos ADD COLUMN publicado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE senderos ALTER COLUMN publicado SET DEFAULT FALSE;

CREATE TABLE sendero_fotos (
    id          UUID PRIMARY KEY,
    sendero_id  BIGINT NOT NULL,
    ruta        VARCHAR(200) NOT NULL,
    tipo        VARCHAR(60) NOT NULL,
    orden       INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_sendero_fotos_sendero FOREIGN KEY (sendero_id) REFERENCES senderos (id) ON DELETE CASCADE
);

CREATE INDEX ix_sendero_fotos_sendero ON sendero_fotos (sendero_id, orden);
