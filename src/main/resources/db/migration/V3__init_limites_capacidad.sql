-- Limites de capacidad de carga por sendero y temporada (Sprint 1 - RF-23 a RF-26)

CREATE TABLE limites_capacidad (
    id                        BIGSERIAL PRIMARY KEY,
    sendero_id                BIGINT NOT NULL,
    temporada_inicio          DATE NOT NULL,
    temporada_fin             DATE NOT NULL,
    cupo_maximo_dia           INTEGER NOT NULL,
    umbral_alerta_pct         SMALLINT NOT NULL DEFAULT 80,
    configurado_por_usuario_id UUID,
    configurado_por_externo   VARCHAR(200),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_limites_capacidad_sendero FOREIGN KEY (sendero_id) REFERENCES senderos (id) ON DELETE CASCADE,
    CONSTRAINT fk_limites_capacidad_usuario FOREIGN KEY (configurado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT ck_limites_capacidad_temporada CHECK (temporada_fin >= temporada_inicio),
    CONSTRAINT ck_limites_capacidad_cupo_positivo CHECK (cupo_maximo_dia > 0),
    CONSTRAINT ck_limites_capacidad_umbral_rango CHECK (umbral_alerta_pct BETWEEN 1 AND 100),
    CONSTRAINT ck_limites_capacidad_origen CHECK (
        (configurado_por_usuario_id IS NOT NULL AND configurado_por_externo IS NULL)
        OR (configurado_por_usuario_id IS NULL AND configurado_por_externo IS NOT NULL)
    )
);

CREATE INDEX ix_limites_capacidad_sendero ON limites_capacidad (sendero_id);
CREATE INDEX ix_limites_capacidad_temporada ON limites_capacidad (sendero_id, temporada_inicio, temporada_fin);
