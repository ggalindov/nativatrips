-- RF-41: los correos al turista salen en el idioma con el que reservo (es, en, fr o pt).
-- Las reservas existentes se hicieron con el portal en espanol.
ALTER TABLE reservas ADD COLUMN idioma VARCHAR(2) NOT NULL DEFAULT 'es';
