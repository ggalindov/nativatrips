-- Reservas: creacion, bloqueo temporal e historial de estados (Sprint 1/2 - RF-01 a RF-13)

CREATE TABLE reservas (
    id                        UUID PRIMARY KEY,
    codigo_reserva            VARCHAR(30),
    sendero_id                BIGINT NOT NULL,
    turista_id                UUID NOT NULL,
    guia_id                   UUID,
    fecha_tour                DATE NOT NULL,
    cantidad_personas         INTEGER NOT NULL,
    tipo_grupo                VARCHAR(30) NOT NULL,
    estado                    VARCHAR(30) NOT NULL,
    bloqueo_expira_en         TIMESTAMPTZ,
    asistencia_registrada_en  TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_reservas_codigo_reserva UNIQUE (codigo_reserva),
    CONSTRAINT fk_reservas_sendero FOREIGN KEY (sendero_id) REFERENCES senderos (id),
    CONSTRAINT fk_reservas_turista FOREIGN KEY (turista_id) REFERENCES usuarios (id),
    CONSTRAINT fk_reservas_guia FOREIGN KEY (guia_id) REFERENCES usuarios (id),
    CONSTRAINT ck_reservas_cantidad_positiva CHECK (cantidad_personas > 0),
    CONSTRAINT ck_reservas_tipo_grupo CHECK (tipo_grupo IN ('ESTANDAR', 'GRUPO_CORPORATIVO', 'NECESIDAD_ESPECIAL')),
    CONSTRAINT ck_reservas_estado CHECK (estado IN
        ('PENDIENTE_PAGO', 'EN_REVISION', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA', 'COMPLETADA'))
);

CREATE INDEX ix_reservas_sendero_fecha ON reservas (sendero_id, fecha_tour);
CREATE INDEX ix_reservas_turista ON reservas (turista_id);
CREATE INDEX ix_reservas_guia ON reservas (guia_id);
CREATE INDEX ix_reservas_estado ON reservas (estado);
CREATE INDEX ix_reservas_bloqueo_expira_en ON reservas (bloqueo_expira_en) WHERE bloqueo_expira_en IS NOT NULL;

CREATE TABLE reserva_integrantes (
    id                    UUID PRIMARY KEY,
    reserva_id            UUID NOT NULL,
    nombre_completo       VARCHAR(200) NOT NULL,
    documento_identidad   VARCHAR(30) NOT NULL,

    CONSTRAINT fk_reserva_integrantes_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE
);

CREATE INDEX ix_reserva_integrantes_reserva ON reserva_integrantes (reserva_id);

-- RNF-13: el estado de una reserva nunca se sobreescribe sin dejar rastro de la transicion.
CREATE TABLE reserva_estado_historial (
    id                    UUID PRIMARY KEY,
    reserva_id            UUID NOT NULL,
    estado_anterior       VARCHAR(30),
    estado_nuevo          VARCHAR(30) NOT NULL,
    motivo                TEXT,
    origen                VARCHAR(30) NOT NULL,
    cambiado_por_usuario_id UUID,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reserva_estado_historial_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_estado_historial_usuario FOREIGN KEY (cambiado_por_usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX ix_reserva_estado_historial_reserva ON reserva_estado_historial (reserva_id);
