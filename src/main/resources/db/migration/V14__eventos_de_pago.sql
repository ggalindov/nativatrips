-- ADR-005 punto 4 (NAT-93, HU-03 criterio 4): idempotencia. Cada evento aplicado queda con su par
-- transaccion + estado; si la pasarela lo repite, no se vuelve a procesar ni se duplica el comprobante.

CREATE TABLE eventos_pago (
    id              UUID PRIMARY KEY,
    pago_id         UUID NOT NULL,
    transaccion_id  VARCHAR(64) NOT NULL,
    estado          VARCHAR(20) NOT NULL,
    recibido_en     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_eventos_pago_transaccion_estado UNIQUE (transaccion_id, estado),
    CONSTRAINT fk_eventos_pago_pago FOREIGN KEY (pago_id) REFERENCES pagos (id) ON DELETE CASCADE
);

CREATE INDEX ix_eventos_pago_pago ON eventos_pago (pago_id);
