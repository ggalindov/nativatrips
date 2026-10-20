package com.nativatrips.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ADR-005: llaves de Wompi solo en variables de entorno (el repositorio es publico). Sin valores
 * por defecto para los secretos: en desarrollo se usan las del sandbox de la cuenta (NAT-102).
 */
@ConfigurationProperties(prefix = "wompi")
public class WompiProperties {

    private String llavePublica;
    private String llavePrivada;
    private String secretoIntegridad;
    private String secretoEventos;
    private String urlCheckout = "https://checkout.wompi.co/p/";
    private String urlApi = "https://sandbox.wompi.co/v1";
    private String moneda = "COP";

    public String getLlavePublica() {
        return llavePublica;
    }

    public void setLlavePublica(String llavePublica) {
        this.llavePublica = llavePublica;
    }

    public String getLlavePrivada() {
        return llavePrivada;
    }

    public void setLlavePrivada(String llavePrivada) {
        this.llavePrivada = llavePrivada;
    }

    public String getSecretoIntegridad() {
        return secretoIntegridad;
    }

    public void setSecretoIntegridad(String secretoIntegridad) {
        this.secretoIntegridad = secretoIntegridad;
    }

    public String getSecretoEventos() {
        return secretoEventos;
    }

    public void setSecretoEventos(String secretoEventos) {
        this.secretoEventos = secretoEventos;
    }

    public String getUrlCheckout() {
        return urlCheckout;
    }

    public void setUrlCheckout(String urlCheckout) {
        this.urlCheckout = urlCheckout;
    }

    public String getUrlApi() {
        return urlApi;
    }

    public void setUrlApi(String urlApi) {
        this.urlApi = urlApi;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public boolean isConfigurado() {
        return llavePublica != null && !llavePublica.isBlank()
                && secretoIntegridad != null && !secretoIntegridad.isBlank();
    }
}
