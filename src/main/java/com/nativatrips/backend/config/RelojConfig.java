package com.nativatrips.backend.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Las reglas de fechas (semana de operacion, apartados) usan la hora de Colombia y se prueban con un reloj fijo. */
@Configuration
public class RelojConfig {

    public static final ZoneId ZONA_OPERACION = ZoneId.of("America/Bogota");

    @Bean
    public Clock reloj() {
        return Clock.system(ZONA_OPERACION);
    }
}
