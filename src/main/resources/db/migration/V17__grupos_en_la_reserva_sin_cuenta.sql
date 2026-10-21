-- RF-09 y RF-11: la reserva sin cuenta trae tipo de grupo y requerimientos especiales. Un grupo con
-- necesidades especiales siempre dice cuales son (las reservas antiguas sin titular quedan fuera).
ALTER TABLE reservas
    ADD COLUMN requerimientos_especiales VARCHAR(500),
    ADD CONSTRAINT ck_reservas_necesidad_con_detalle
        CHECK (tipo_grupo <> 'NECESIDAD_ESPECIAL' OR titular_correo IS NULL OR requerimientos_especiales IS NOT NULL);
