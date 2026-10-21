package com.nativatrips.backend.pagos.pasarela;

/** Arma eventos transaction.updated firmados como los envia Wompi, para las pruebas. */
public final class EventoWompiDePrueba {

    public static final String SECRETO = "test_events_secreto";
    public static final long TIMESTAMP = 1_760_972_400L;

    private EventoWompiDePrueba() {
    }

    public static String firmado(String transaccionId, String referencia, String estado, long montoEnCentavos) {
        String checksum = FirmasWompi.checksumEvento(transaccionId + estado + montoEnCentavos, TIMESTAMP, SECRETO);
        return conChecksum(transaccionId, referencia, estado, montoEnCentavos, checksum);
    }

    public static String conChecksum(
            String transaccionId, String referencia, String estado, long montoEnCentavos, String checksum) {
        return """
                {"event": "transaction.updated",
                 "data": {"transaction": {"id": "%s", "amount_in_cents": %d, "reference": "%s", "currency": "COP",
                          "payment_method_type": "CARD", "status": "%s"}},
                 "environment": "test",
                 "signature": {"properties": ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
                               "checksum": "%s"},
                 "timestamp": %d, "sent_at": "2026-10-20T15:00:00.000Z"}"""
                .formatted(transaccionId, montoEnCentavos, referencia, estado, checksum, TIMESTAMP);
    }
}
