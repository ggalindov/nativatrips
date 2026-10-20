-- HU-02 (NAT-83), ADR-004: el turista reserva sin crear cuenta. La reserva guarda los datos del
-- titular; turista_id queda solo para las reservas hechas con la cuenta TURISTA anterior.

ALTER TABLE reservas
    ALTER COLUMN turista_id DROP NOT NULL,
    ADD COLUMN titular_nombre          VARCHAR(200),
    ADD COLUMN titular_tipo_documento  VARCHAR(20),
    ADD COLUMN titular_documento       VARCHAR(30),
    ADD COLUMN titular_nacionalidad    VARCHAR(2),
    ADD COLUMN titular_correo          VARCHAR(255),
    ADD COLUMN titular_indicativo      VARCHAR(4),
    ADD COLUMN titular_celular         VARCHAR(20),
    ADD CONSTRAINT ck_reservas_turista_o_titular CHECK (turista_id IS NOT NULL OR titular_correo IS NOT NULL),
    ADD CONSTRAINT ck_reservas_titular_tipo_documento
        CHECK (titular_tipo_documento IN ('CC', 'TI', 'CE', 'PPT', 'PASAPORTE', 'DNI'));

-- Cada integrante con su tipo de documento y nacionalidad (los extranjeros se reportan al parque).
ALTER TABLE reserva_integrantes
    ADD COLUMN tipo_documento VARCHAR(20),
    ADD COLUMN nacionalidad   VARCHAR(2),
    ADD CONSTRAINT ck_reserva_integrantes_tipo_documento
        CHECK (tipo_documento IN ('CC', 'TI', 'CE', 'PPT', 'PASAPORTE', 'DNI'));
