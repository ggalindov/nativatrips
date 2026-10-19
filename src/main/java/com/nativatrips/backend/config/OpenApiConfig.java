package com.nativatrips.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    static final String ESQUEMA_JWT = "bearerJwt";

    @Bean
    public OpenAPI nativaTripsOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("NativaTrips API")
                        .version("v1")
                        .description("Reservas de ecoturismo de Eco Palacio Tur: senderos, capacidad de carga, "
                                + "reservas, pagos y asistente."))
                .components(new Components().addSecuritySchemes(ESQUEMA_JWT, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                // Las rutas publicas (catalogo, auth, webhook) siguen abiertas: el requisito global solo
                // indica en Swagger UI que el resto espera el token del equipo.
                .addSecurityItem(new SecurityRequirement().addList(ESQUEMA_JWT));
    }
}
