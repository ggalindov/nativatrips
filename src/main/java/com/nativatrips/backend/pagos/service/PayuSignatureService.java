package com.nativatrips.backend.pagos.service;

import com.nativatrips.backend.config.PayuProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.stereotype.Service;

/**
 * Calcula y valida las firmas MD5 que exige PayU WebCheckout.
 *
 * Firma de solicitud (la que viaja en el formulario hacia PayU):
 *   MD5(apiKey~merchantId~referenceCode~amount~currency)
 *
 * Firma de confirmacion (la que PayU envia de vuelta al webhook, y que debemos validar
 * ANTES de confiar en el estado del pago; sin esto cualquiera podria falsificar un
 * "pago aprobado" con un POST directo):
 *   MD5(apiKey~merchantId~referenceSale~value~currency~statePol)
 *
 * El monto debe formatearse igual en ambos lados (formulario y firma) o PayU la rechaza;
 * PayU documenta un decimal fijo, p.ej. 150000 -> "150000.0".
 */
@Service
public class PayuSignatureService {

    private final PayuProperties payuProperties;

    public PayuSignatureService(PayuProperties payuProperties) {
        this.payuProperties = payuProperties;
    }

    public String formatearMonto(BigDecimal monto) {
        return monto.setScale(1, RoundingMode.HALF_UP).toPlainString();
    }

    public String generarFirmaSolicitud(String referenceCode, BigDecimal amount, String currency) {
        String cadena = String.join(
                "~",
                payuProperties.getApiKey(),
                payuProperties.getMerchantId(),
                referenceCode,
                formatearMonto(amount),
                currency);
        return md5(cadena);
    }

    public boolean validarFirmaConfirmacion(
            String referenceSale, String value, String currency, String statePol, String firmaRecibida) {
        String cadena = String.join(
                "~", payuProperties.getApiKey(), payuProperties.getMerchantId(), referenceSale, value, currency, statePol);
        String firmaCalculada = md5(cadena);
        return firmaCalculada.equalsIgnoreCase(firmaRecibida);
    }

    private String md5(String texto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] hash = digest.digest(texto.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) {
                    hex.append('0');
                }
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("MD5 no disponible en este JVM", ex);
        }
    }
}
