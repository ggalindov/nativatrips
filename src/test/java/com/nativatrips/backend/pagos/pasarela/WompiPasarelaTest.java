package com.nativatrips.backend.pagos.pasarela;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.model.Pago;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WompiPasarelaTest {

    private static final Instant VENCE = Instant.parse("2026-10-20T15:15:00Z");

    private WompiProperties propiedades;
    private WompiPasarela pasarela;

    @BeforeEach
    void setUp() {
        propiedades = new WompiProperties();
        propiedades.setLlavePublica("pub_test_llave");
        propiedades.setSecretoIntegridad("test_integrity_secreto");
        pasarela = new WompiPasarela(propiedades, "https://nativatrips.co/");
    }

    @Test
    void elCheckoutCobraElTotalEnCentavosConFirmaYVenceConElApartado() {
        Pago pago = new Pago(UUID.randomUUID(), "NT-7Q4KX2-ABC", new BigDecimal("135000.00"), "COP");

        CheckoutWompi checkout = (CheckoutWompi) pasarela.prepararCheckout(pago, VENCE, "laura@example.com");

        assertThat(checkout.montoEnCentavos()).isEqualTo(13_500_000L);
        assertThat(checkout.firmaIntegridad()).isEqualTo(FirmasWompi.integridad(
                "NT-7Q4KX2-ABC", 13_500_000L, "COP", "2026-10-20T15:15:00Z", "test_integrity_secreto"));
        String url = URLDecoder.decode(checkout.url(), StandardCharsets.UTF_8);
        assertThat(url).startsWith("https://checkout.wompi.co/p/?")
                .contains("public-key=pub_test_llave")
                .contains("amount-in-cents=13500000")
                .contains("currency=COP")
                .contains("reference=NT-7Q4KX2-ABC")
                .contains("signature:integrity=" + checkout.firmaIntegridad())
                .contains("expiration-time=2026-10-20T15:15:00Z")
                .contains("redirect-url=https://nativatrips.co/mi-reserva/resultado-pago")
                .contains("customer-data:email=laura@example.com");
        assertThat(url).doesNotContain("test_integrity_secreto");
    }

    @Test
    void sinLlavesNoSeCobraYSeAvisaQueLosPagosNoEstanConfigurados() {
        propiedades.setLlavePublica("");

        assertThatThrownBy(() -> pasarela.prepararCheckout(
                        new Pago(UUID.randomUUID(), "REF", new BigDecimal("1000"), "COP"), VENCE, null))
                .isInstanceOfSatisfying(BusinessRuleException.class,
                        ex -> assertThat(ex.getStatus().value()).isEqualTo(503));
    }

    @Test
    void unMontoConFraccionDeCentavoNoSeRedondeaASilencio() {
        assertThatThrownBy(() -> WompiPasarela.enCentavos(new BigDecimal("1000.005")))
                .isInstanceOf(ArithmeticException.class);
        assertThat(WompiPasarela.enCentavos(new BigDecimal("45000"))).isEqualTo(4_500_000L);
    }
}
