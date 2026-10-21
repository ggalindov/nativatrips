-- HU-18 (NAT-112), ADR-004: el turista gestiona su reserva con un enlace magico. Solo se guarda
-- el hash del token; cada enlace tiene un proposito y un vencimiento, y pedir uno nuevo revoca el
-- anterior. Cada uso del enlace queda registrado para auditoria (criterio 5).

CREATE TABLE enlaces_reserva (
    id           UUID PRIMARY KEY,
    reserva_id   UUID NOT NULL,
    token_hash   VARCHAR(64) NOT NULL,
    proposito    VARCHAR(30) NOT NULL,
    expira_en    TIMESTAMPTZ NOT NULL,
    revocado_en  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_enlaces_reserva_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_enlaces_reserva_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
    CONSTRAINT ck_enlaces_reserva_proposito CHECK (proposito IN ('GESTIONAR_RESERVA'))
);

CREATE INDEX ix_enlaces_reserva_reserva ON enlaces_reserva (reserva_id);

CREATE TABLE accesos_enlace_reserva (
    id          UUID PRIMARY KEY,
    enlace_id   UUID NOT NULL,
    accion      VARCHAR(40) NOT NULL,
    ip          VARCHAR(64),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_accesos_enlace_reserva_enlace FOREIGN KEY (enlace_id) REFERENCES enlaces_reserva (id) ON DELETE CASCADE
);

CREATE INDEX ix_accesos_enlace_reserva_enlace ON accesos_enlace_reserva (enlace_id);
