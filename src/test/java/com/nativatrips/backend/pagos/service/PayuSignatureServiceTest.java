package com.nativatrips.backend.pagos.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.config.PayuProperties;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PayuSignatureServiceTest {

    private PayuSignatureService signatureService;

    @BeforeEach
    void setUp() {
        PayuProperties properties = new PayuProperties();
        properties.setApiKey("4Vj8eK4rloUd272L48hsrarnUA");
        properties.setMerchantId("508029");
        signatureService = new PayuSignatureService(properties);
    }

    @Test
    void formateaElMontoConUnDecimalFijo() {
        assertThat(signatureService.formatearMonto(new BigDecimal("50000"))).isEqualTo("50000.0");
        assertThat(signatureService.formatearMonto(new BigDecimal("50000.00"))).isEqualTo("50000.0");
        assertThat(signatureService.formatearMonto(new BigDecimal("50000.55"))).isEqualTo("50000.6");
    }

    @Test
    void generaLaFirmaEsperadaSegunLaFormulaDePayu() {
        // Vector calculado independientemente con md5sum sobre
        // "4Vj8eK4rloUd272L48hsrarnUA~508029~TestPayU~10000.0~COP" para verificar que la
        // concatenacion y el formato de monto coinciden exactamente con lo que exige PayU.
        String firma = signatureService.generarFirmaSolicitud("TestPayU", new BigDecimal("10000"), "COP");

        assertThat(firma).isEqualTo("18780c24c2b6a86302961097a382cb63");
    }

    @Test
    void laFirmaEsDeterministaParaLosMismosDatos() {
        String firma1 = signatureService.generarFirmaSolicitud("REF-1", new BigDecimal("25000"), "COP");
        String firma2 = signatureService.generarFirmaSolicitud("REF-1", new BigDecimal("25000"), "COP");

        assertThat(firma1).isEqualTo(firma2);
    }

    @Test
    void laFirmaCambiaSiCambiaElMonto() {
        String firma1 = signatureService.generarFirmaSolicitud("REF-1", new BigDecimal("25000"), "COP");
        String firma2 = signatureService.generarFirmaSolicitud("REF-1", new BigDecimal("25001"), "COP");

        assertThat(firma1).isNotEqualTo(firma2);
    }

    @Test
    void validaCorrectamenteUnaFirmaDeConfirmacionAutentica() {
        String referenceSale = "REF-1";
        String value = "25000.0";
        String currency = "COP";
        String statePol = "4";

        boolean valida = signatureService.validarFirmaConfirmacion(
                referenceSale,
                value,
                currency,
                statePol,
                calcularFirmaConfirmacionEsperada(referenceSale, value, currency, statePol));

        assertThat(valida).isTrue();
    }

    @Test
    void rechazaUnaFirmaDeConfirmacionAlteradaPorUnAtacante() {
        // Un atacante que intenta cambiar el estado de RECHAZADO (6) a APROBADO (4) sin conocer
        // el ApiKey no puede recalcular la firma: debe ser rechazada.
        boolean valida = signatureService.validarFirmaConfirmacion(
                "REF-1", "25000.0", "COP", "4",
                calcularFirmaConfirmacionEsperada("REF-1", "25000.0", "COP", "6"));

        assertThat(valida).isFalse();
    }

    @Test
    void rechazaUnaFirmaConValorAlterado() {
        boolean valida = signatureService.validarFirmaConfirmacion(
                "REF-1", "999999.0", "COP", "4",
                calcularFirmaConfirmacionEsperada("REF-1", "25000.0", "COP", "4"));

        assertThat(valida).isFalse();
    }

    private String calcularFirmaConfirmacionEsperada(
            String referenceSale, String value, String currency, String statePol) {
        // Reimplementa la formula de confirmacion de PayU (apiKey~merchantId~referenceSale~value~currency~statePol)
        // usando los mismos valores fijos de ApiKey/merchantId configurados en setUp(), para producir
        // la firma "autentica" contra la que se comparan los casos de manipulacion.
        String cadena = String.join("~", "4Vj8eK4rloUd272L48hsrarnUA", "508029", referenceSale, value, currency, statePol);
        return org.springframework.util.DigestUtils.md5DigestAsHex(cadena.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
