package com.nativatrips.backend.pagos.pasarela;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.PayuProperties;
import com.nativatrips.backend.pagos.dto.ConfirmacionPayuPayload;
import com.nativatrips.backend.pagos.model.EstadoPago;
import com.nativatrips.backend.pagos.service.PayuSignatureService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** El webhook de PayU solo entrega resultados con firma valida (hasta que se retire PayU). */
class PayuPasarelaTest {

    private PayuSignatureService signatureService;
    private PayuPasarela pasarela;

    @BeforeEach
    void setUp() {
        PayuProperties propiedades = new PayuProperties();
        propiedades.setApiKey("4Vj8eK4rloUd272L48hsrarnUA");
        propiedades.setMerchantId("508029");
        propiedades.setAccountId("512321");
        propiedades.setCurrency("COP");
        propiedades.setTestMode(true);
        propiedades.setCheckoutUrlSandbox("https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/");
        signatureService = new PayuSignatureService(propiedades);
        pasarela = new PayuPasarela(signatureService);
    }

    @Test
    void unaConfirmacionConFirmaInvalidaSeRechaza() {
        var payload = new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", "4", "firma-mala", "TX-1", "{}");

        assertThatThrownBy(() -> pasarela.verificar(payload)).isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void unaConfirmacionFirmadaSeTraduceAlEstadoDelPago() {
        assertThat(verificar("4").estado()).isEqualTo(EstadoPago.APROBADO);
        assertThat(verificar("6").estado()).isEqualTo(EstadoPago.RECHAZADO);
        assertThat(verificar("5").estado()).isEqualTo(EstadoPago.EXPIRADO);
        assertThat(verificar("7").estado()).isEqualTo(EstadoPago.PENDIENTE);
        assertThat(verificar("104").estado()).isEqualTo(EstadoPago.ERROR);
        assertThat(verificar("4").monto()).isEqualByComparingTo("50000");
    }

    private ResultadoPago verificar(String statePol) {
        String firma = firmaConfirmacion("REF-1", "50000.0", "COP", statePol);
        return pasarela.verificar(new ConfirmacionPayuPayload("REF-1", "50000.0", "COP", statePol, firma, "TX-1", "{}"));
    }

    /** MD5(apiKey~merchantId~referencia~valor~moneda~statePol), como la calcula PayU. */
    private static String firmaConfirmacion(String referencia, String valor, String moneda, String statePol) {
        try {
            byte[] hash = java.security.MessageDigest.getInstance("MD5").digest(
                    String.join("~", "4Vj8eK4rloUd272L48hsrarnUA", "508029", referencia, valor, moneda, statePol)
                            .getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
