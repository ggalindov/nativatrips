-- RF-10: el aviso previo al tour (48 horas antes) sale una sola vez por reserva.
ALTER TABLE reservas ADD COLUMN aviso_previo_enviado_en TIMESTAMPTZ;
CREATE INDEX ix_reservas_aviso_previo_pendiente ON reservas (fecha_tour) WHERE aviso_previo_enviado_en IS NULL;
