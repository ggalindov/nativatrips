-- Modulo de usuarios y autenticacion (Sprint 0 - RF-32, RF-33, RF-34)

CREATE TABLE usuarios (
    id                  UUID PRIMARY KEY,
    email               VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    nombre_completo      VARCHAR(200) NOT NULL,
    documento_identidad VARCHAR(30),
    telefono            VARCHAR(30),
    rol                 VARCHAR(30) NOT NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_documento_identidad UNIQUE (documento_identidad),
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('TURISTA', 'PERSONAL_ADMINISTRATIVO', 'GUIA_TURISTICO', 'GERENCIA'))
);

CREATE INDEX ix_usuarios_rol ON usuarios (rol);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY,
    usuario_id  UUID NOT NULL,
    token       VARCHAR(255) NOT NULL,
    expira_en   TIMESTAMPTZ NOT NULL,
    usado       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token),
    CONSTRAINT fk_password_reset_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE INDEX ix_password_reset_tokens_usuario ON password_reset_tokens (usuario_id);
