-- Ficha tecnica ampliada de los senderos (HU-01, NAT-82) y nivel EXIGENTE que ya usa el portal.
-- Los datos tecnicos son opcionales: se completan a medida que el equipo los mide en campo.

ALTER TABLE senderos
    ADD COLUMN distancia_km     NUMERIC(5, 1),
    ADD COLUMN desnivel_m       INTEGER,
    ADD COLUMN altitud_max_m    INTEGER,
    ADD COLUMN sector           VARCHAR(120),
    ADD COLUMN hora_salida      TIME NOT NULL DEFAULT '07:00',
    ADD COLUMN punto_encuentro  VARCHAR(200),
    ADD CONSTRAINT ck_senderos_distancia_positiva CHECK (distancia_km IS NULL OR distancia_km > 0),
    ADD CONSTRAINT ck_senderos_desnivel_no_negativo CHECK (desnivel_m IS NULL OR desnivel_m >= 0),
    ADD CONSTRAINT ck_senderos_altitud_positiva CHECK (altitud_max_m IS NULL OR altitud_max_m > 0);

ALTER TABLE senderos DROP CONSTRAINT ck_senderos_nivel_dificultad;
ALTER TABLE senderos
    ADD CONSTRAINT ck_senderos_nivel_dificultad CHECK (nivel_dificultad IN ('FACIL', 'MODERADO', 'DIFICIL', 'EXIGENTE'));

-- Puntos destacados del recorrido, en el orden en que se muestran.
CREATE TABLE sendero_destacados (
    sendero_id  BIGINT NOT NULL,
    orden       INTEGER NOT NULL,
    texto       VARCHAR(120) NOT NULL,

    CONSTRAINT pk_sendero_destacados PRIMARY KEY (sendero_id, orden),
    CONSTRAINT fk_sendero_destacados_sendero FOREIGN KEY (sendero_id) REFERENCES senderos (id) ON DELETE CASCADE
);
