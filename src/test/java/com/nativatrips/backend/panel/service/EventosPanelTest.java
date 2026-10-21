package com.nativatrips.backend.panel.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class EventosPanelTest {

    private final EventosPanel eventos = new EventosPanel();

    @AfterEach
    void limpiar() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void cadaPestanaDelPanelEsUnaSuscripcionQueSeQuitaAlCompletarse() {
        var emisor = eventos.suscribir();
        assertThat(eventos.suscritos()).isEqualTo(1);

        emisor.complete();
        eventos.publicar("reserva", Map.of("codigo", "NT-7Q4KX2"));

        assertThat(eventos.suscritos()).isZero();
    }

    @Test
    void conTransaccionElEventoEsperaALaConfirmacion() {
        eventos.suscribir();
        TransactionSynchronizationManager.initSynchronization();

        eventos.publicar("reserva", Map.of("codigo", "NT-7Q4KX2"));

        assertThat(TransactionSynchronizationManager.getSynchronizations()).hasSize(1);
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
    }
}
