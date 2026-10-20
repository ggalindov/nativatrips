-- ADR-008: capacidad de carga por dia y por sendero. Un solo registro por sendero y fecha; quien
-- lo carga queda registrado. La tabla por temporada se retira en su propia migracion.

CREATE TABLE capacidad_dia (
    id                      BIGSERIAL PRIMARY KEY,
    sendero_id              BIGINT NOT NULL,
    fecha                   DATE NOT NULL,
    cupo_maximo             INTEGER NOT NULL,
    umbral_alerta_pct       SMALLINT NOT NULL DEFAULT 80,
    cargado_por_usuario_id  UUID NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_capacidad_dia_sendero_fecha UNIQUE (sendero_id, fecha),
    CONSTRAINT fk_capacidad_dia_sendero FOREIGN KEY (sendero_id) REFERENCES senderos (id) ON DELETE CASCADE,
    CONSTRAINT fk_capacidad_dia_usuario FOREIGN KEY (cargado_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT ck_capacidad_dia_cupo_positivo CHECK (cupo_maximo > 0),
    CONSTRAINT ck_capacidad_dia_umbral_rango CHECK (umbral_alerta_pct BETWEEN 1 AND 100)
);

CREATE INDEX ix_capacidad_dia_fecha ON capacidad_dia (fecha);
