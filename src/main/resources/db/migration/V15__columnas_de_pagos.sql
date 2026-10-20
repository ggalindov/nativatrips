-- ADR-005: la pasarela es Wompi. Las columnas de pagos dejan de llevar el nombre de la pasarela
-- anterior.

ALTER TABLE pagos RENAME COLUMN referencia_payu TO referencia;
ALTER TABLE pagos RENAME COLUMN transaction_id_payu TO transaccion_id;
ALTER TABLE pagos RENAME CONSTRAINT uq_pagos_referencia_payu TO uq_pagos_referencia;
