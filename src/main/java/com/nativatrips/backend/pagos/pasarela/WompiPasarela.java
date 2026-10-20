package com.nativatrips.backend.pagos.pasarela;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.config.WompiProperties;
import com.nativatrips.backend.pagos.model.Pago;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/** Adaptador de Wompi Web Checkout (ADR-005): el navegador va a Wompi con la firma de integridad. */
@Component
public class WompiPasarela implements PasarelaPago {

    private final WompiProperties propiedades;
    private final String urlRedireccion;

    public WompiPasarela(
            WompiProperties propiedades, @Value("${app.frontend-url:http://localhost:3000}") String urlFrontend) {
        this.propiedades = propiedades;
        String base = urlFrontend.endsWith("/") ? urlFrontend.substring(0, urlFrontend.length() - 1) : urlFrontend;
        this.urlRedireccion = base + "/mi-reserva/resultado-pago";
    }

    /**
     * El checkout vence cuando vence el apartado del cupo: Wompi no deja pagar un cupo ya liberado.
     * Wompi agrega {@code ?id=<transaccion>} a la URL de regreso; esa URL nunca confirma el pago.
     */
    @Override
    public CheckoutPago prepararCheckout(Pago pago, Instant venceEn, String correoComprador) {
        if (!propiedades.isConfigurado()) {
            throw new BusinessRuleException(
                    HttpStatus.SERVICE_UNAVAILABLE, "Los pagos no estan configurados: faltan las llaves de Wompi");
        }
        long montoEnCentavos = enCentavos(pago.getMonto());
        String expiracion = DateTimeFormatter.ISO_INSTANT.format(venceEn.truncatedTo(ChronoUnit.MILLIS));
        String firma = FirmasWompi.integridad(
                pago.getReferencia(), montoEnCentavos, pago.getMoneda(), expiracion, propiedades.getSecretoIntegridad());

        UriComponentsBuilder url = UriComponentsBuilder.fromUriString(propiedades.getUrlCheckout())
                .queryParam("public-key", propiedades.getLlavePublica())
                .queryParam("currency", pago.getMoneda())
                .queryParam("amount-in-cents", montoEnCentavos)
                .queryParam("reference", pago.getReferencia())
                .queryParam("signature:integrity", firma)
                .queryParam("expiration-time", expiracion)
                .queryParam("redirect-url", urlRedireccion);
        if (correoComprador != null && !correoComprador.isBlank()) {
            url.queryParam("customer-data:email", correoComprador);
        }

        return new CheckoutWompi(
                url.encode().build().toUriString(),
                propiedades.getLlavePublica(),
                pago.getReferencia(),
                montoEnCentavos,
                pago.getMoneda(),
                firma,
                venceEn,
                urlRedireccion);
    }

    static long enCentavos(BigDecimal monto) {
        return monto.movePointRight(2).longValueExact();
    }
}
