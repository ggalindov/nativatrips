-- RF-37 (S4-18, Anexo 16): una reserva confirmada no se cancela con devolucion; solo se reprograma
-- sobre el mismo cupo pagado y con soporte de una de tres causales. La solicitud pone la reserva en
-- EN_REVISION; el administrador aprueba (nueva fecha) o rechaza (cancelada sin devolucion).
CREATE TABLE solicitudes_reprogramacion (
    id                      UUID PRIMARY KEY,
    reserva_id              UUID NOT NULL,
    causal                  VARCHAR(30) NOT NULL,
    descripcion             VARCHAR(1000) NOT NULL,
    fecha_original          DATE NOT NULL,
    fecha_deseada           DATE NOT NULL,
    soporte_ruta            VARCHAR(200) NOT NULL,
    soporte_tipo            VARCHAR(60) NOT NULL,
    estado                  VARCHAR(20) NOT NULL,
    decidida_por_usuario_id UUID,
    decidida_en             TIMESTAMPTZ,
    motivo_decision         VARCHAR(500),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_solicitudes_reprogramacion_reserva FOREIGN KEY (reserva_id) REFERENCES reservas (id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitudes_reprogramacion_usuario FOREIGN KEY (decidida_por_usuario_id) REFERENCES usuarios (id),
    CONSTRAINT ck_solicitudes_reprogramacion_causal
        CHECK (causal IN ('INCAPACIDAD_MEDICA', 'FALLECIMIENTO_FAMILIAR', 'FUERZA_MAYOR')),
    CONSTRAINT ck_solicitudes_reprogramacion_estado CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA'))
);

CREATE INDEX ix_solicitudes_reprogramacion_reserva ON solicitudes_reprogramacion (reserva_id);
CREATE INDEX ix_solicitudes_reprogramacion_estado ON solicitudes_reprogramacion (estado, created_at);
