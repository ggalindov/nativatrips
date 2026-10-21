-- RF-12 y RF-11: el guia marca la asistencia de cada persona en la salida; con esa marca se cuenta
-- el historial de visitas de cada documento. NULL = aun sin marcar.
ALTER TABLE reserva_integrantes ADD COLUMN asistio BOOLEAN;

CREATE INDEX ix_reserva_integrantes_documento ON reserva_integrantes (tipo_documento, documento_identidad);
