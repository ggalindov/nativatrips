-- BUG-02 (NAT-122): un token cerrado con logout deja de servir aunque no haya vencido.
-- Se guarda su identificador (jti) hasta que vence; despues una tarea lo borra.

CREATE TABLE tokens_revocados (
    jti          UUID PRIMARY KEY,
    expira_en    TIMESTAMPTZ NOT NULL,
    revocado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_tokens_revocados_expira_en ON tokens_revocados (expira_en);
