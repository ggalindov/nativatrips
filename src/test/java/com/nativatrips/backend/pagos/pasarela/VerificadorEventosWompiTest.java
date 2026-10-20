package com.nativatrips.backend.pagos.pasarela;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.model.EstadoPago;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

/** ADR-005: solo se cree un evento cuyo checksum coincide. */
class VerificadorEventosWompiTest {

    private VerificadorEventosWompi verificador;

    @BeforeEach
    void setUp() {
        WompiProperties propiedades = new WompiProperties();
        propiedades.setSecretoEventos(EventoWompiDePrueba.SECRETO);
        verificador = new VerificadorEventosWompi(propiedades, JsonMapper.builder().build());
    }

    @Test
    void unEventoFirmadoSeTraduceAlResultadoDelPago() {
        String evento = EventoWompiDePrueba.firmado("1234-1610641025-49201", "NT-7Q4KX2-ABC", "APPROVED", 4_490_000);

        ResultadoPago resultado = verificador.verificar(evento, null).orElseThrow();

        assertThat(resultado.referencia()).isEqualTo("NT-7Q4KX2-ABC");
        assertThat(resultado.transaccionId()).isEqualTo("1234-1610641025-49201");
        assertThat(resultado.estado()).isEqualTo(EstadoPago.APROBADO);
        assertThat(resultado.monto()).isEqualByComparingTo("44900");
        assertThat(resultado.moneda()).isEqualTo("COP");
        assertThat(resultado.respuestaCruda()).isEqualTo(evento);
    }

    @Test
    void unEventoConChecksumFalsoOAlteradoSeRechaza() {
        String falso = EventoWompiDePrueba.conChecksum("TX-1", "REF", "APPROVED", 4_490_000, "0".repeat(64));
        // Firmado por 100 pesos y alterado a 44.900: el checksum ya no coincide.
        String firmadoPorOtroMonto = EventoWompiDePrueba.conChecksum("TX-1", "REF", "APPROVED", 4_490_000,
                FirmasWompi.checksumEvento("TX-1APPROVED10000", EventoWompiDePrueba.TIMESTAMP, EventoWompiDePrueba.SECRETO));

        for (String evento : new String[] {falso, firmadoPorOtroMonto, "no es json", "{}"}) {
            assertThatThrownBy(() -> verificador.verificar(evento, null))
                    .isInstanceOfSatisfying(BusinessRuleException.class,
                            ex -> assertThat(ex.getStatus().value()).isEqualTo(401));
        }
    }

    @Test
    void siLlegaLaCabeceraDeChecksumTambienDebeCoincidir() {
        String evento = EventoWompiDePrueba.firmado("TX-1", "REF", "APPROVED", 100);

        assertThatThrownBy(() -> verificador.verificar(evento, "f".repeat(64))).isInstanceOf(BusinessRuleException.class);
        String checksum = FirmasWompi.checksumEvento("TX-1APPROVED100", EventoWompiDePrueba.TIMESTAMP, EventoWompiDePrueba.SECRETO);
        assertThat(verificador.verificar(evento, checksum.toUpperCase())).isPresent();
    }

    @Test
    void otrosTiposDeEventoNoSeAplican() {
        String evento = EventoWompiDePrueba.firmado("TX-1", "REF", "APPROVED", 100)
                .replace("transaction.updated", "nequi_token.updated");

        assertThat(verificador.verificar(evento, null)).isEmpty();
    }

    @Test
    void cadaEstadoDeWompiTieneSuEstadoDePago() {
        assertThat(VerificadorEventosWompi.mapearEstado("APPROVED")).isEqualTo(EstadoPago.APROBADO);
        assertThat(VerificadorEventosWompi.mapearEstado("DECLINED")).isEqualTo(EstadoPago.RECHAZADO);
        assertThat(VerificadorEventosWompi.mapearEstado("PENDING")).isEqualTo(EstadoPago.PENDIENTE);
        assertThat(VerificadorEventosWompi.mapearEstado("VOIDED")).isEqualTo(EstadoPago.ERROR);
        assertThat(VerificadorEventosWompi.mapearEstado("ERROR")).isEqualTo(EstadoPago.ERROR);
    }
}
