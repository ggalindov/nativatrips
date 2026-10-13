-- Pagos con PayU WebCheckout (Sprint 2 - RF-06, RF-07, RF-13)

CREATE TABLE pagos (
    id                      UUID PRIMARY KEY,
    reserva_id              UUID NOT NULL,
    referencia_payu         VARCHAR(64) NOT NULL,
    transaction_id_payu     VARCHAR(64),
    monto                   NUMERIC(12, 2) NOT NULL,
    moneda                  VARCHAR(10) NOT NULL,
    estado                  VARCHAR(20) NOT NULL,
    respuesta_confirmacion  TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_pagos_referencia_payu UNIQUE (referencia_payu),
    CONSTRAINT fk_pagos_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id),
    CONSTRAINT ck_pagos_estado CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'EXPIRADO', 'ERROR')),
    CONSTRAINT ck_pagos_monto_positivo CHECK (monto > 0)
);

CREATE INDEX ix_pagos_reserva ON pagos (reserva_id);
CREATE INDEX ix_pagos_estado ON pagos (estado);

-- RNF-13: historial append-only de transiciones de estado de un pago.
CREATE TABLE pago_estado_historial (
    id                    UUID PRIMARY KEY,
    pago_id               UUID NOT NULL,
    estado_anterior       VARCHAR(20),
    estado_nuevo          VARCHAR(20) NOT NULL,
    motivo                TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_pago_estado_historial_pago FOREIGN KEY (pago_id) REFERENCES pagos (id) ON DELETE CASCADE
);

CREATE INDEX ix_pago_estado_historial_pago ON pago_estado_historial (pago_id);
