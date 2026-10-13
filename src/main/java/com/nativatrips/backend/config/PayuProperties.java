package com.nativatrips.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "payu")
public class PayuProperties {

    private String apiKey;
    private String merchantId;
    private String accountId;
    private boolean testMode = true;
    private String currency = "COP";
    private String checkoutUrlSandbox;
    private String checkoutUrlProduccion;
    private String responseUrl;
    private String confirmationUrl;

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getMerchantId() {
        return merchantId;
    }

    public void setMerchantId(String merchantId) {
        this.merchantId = merchantId;
    }

    public String getAccountId() {
        return accountId;
    }

    public void setAccountId(String accountId) {
        this.accountId = accountId;
    }

    public boolean isTestMode() {
        return testMode;
    }

    public void setTestMode(boolean testMode) {
        this.testMode = testMode;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getCheckoutUrlSandbox() {
        return checkoutUrlSandbox;
    }

    public void setCheckoutUrlSandbox(String checkoutUrlSandbox) {
        this.checkoutUrlSandbox = checkoutUrlSandbox;
    }

    public String getCheckoutUrlProduccion() {
        return checkoutUrlProduccion;
    }

    public void setCheckoutUrlProduccion(String checkoutUrlProduccion) {
        this.checkoutUrlProduccion = checkoutUrlProduccion;
    }

    public String getResponseUrl() {
        return responseUrl;
    }

    public void setResponseUrl(String responseUrl) {
        this.responseUrl = responseUrl;
    }

    public String getConfirmationUrl() {
        return confirmationUrl;
    }

    public void setConfirmationUrl(String confirmationUrl) {
        this.confirmationUrl = confirmationUrl;
    }

    /** URL del formulario WebCheckout segun el modo configurado (sandbox o produccion). */
    public String getCheckoutUrl() {
        return testMode ? checkoutUrlSandbox : checkoutUrlProduccion;
    }
}
