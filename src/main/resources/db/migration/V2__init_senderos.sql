-- Catalogo de senderos (Sprint 1 - RF-01, RF-02, RF-35)

CREATE TABLE senderos (
    id                   BIGSERIAL PRIMARY KEY,
    nombre               VARCHAR(200) NOT NULL,
    descripcion          TEXT,
    nivel_dificultad     VARCHAR(20) NOT NULL,
    duracion_minutos     INTEGER NOT NULL,
    tipo_experiencia     VARCHAR(50) NOT NULL,
    requisitos_ingreso   TEXT,
    precio               NUMERIC(12, 2) NOT NULL,
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_senderos_nivel_dificultad CHECK (nivel_dificultad IN ('FACIL', 'MODERADO', 'DIFICIL')),
    CONSTRAINT ck_senderos_duracion_positiva CHECK (duracion_minutos > 0),
    CONSTRAINT ck_senderos_precio_no_negativo CHECK (precio >= 0)
);

CREATE INDEX ix_senderos_activo ON senderos (activo);
