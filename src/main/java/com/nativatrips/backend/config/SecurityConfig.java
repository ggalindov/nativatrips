package com.nativatrips.backend.config;

import com.nativatrips.backend.common.dto.ApiErrorResponse;
import com.nativatrips.backend.usuarios.security.JwtAuthenticationFilter;
import java.nio.charset.StandardCharsets;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // habilita @PreAuthorize por rol en los controllers de cada modulo
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        http
                // API stateless con JWT via header Authorization, sin cookies de sesion: CSRF no aplica.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
                        // Contrato OpenAPI y Swagger UI: se apagan en produccion con SPRINGDOC_ENABLED=false.
                        .requestMatchers("/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/senderos/**").permitAll() // RF-01/02: catalogo publico
                        .requestMatchers(HttpMethod.POST, "/api/v1/asistente/mensajes").permitAll() // BUG-04: visitantes
                        .requestMatchers(HttpMethod.POST, "/api/v1/reservas/sin-cuenta").permitAll() // HU-02, ADR-004
                        // Webhook de PayU: no puede enviar JWT: la autenticidad se valida con la
                        // firma MD5 de PayU dentro de PagoService, no con Spring Security.
                        .requestMatchers(HttpMethod.POST, "/api/v1/pagos/confirmacion").permitAll()
                        .anyRequest().authenticated())
                // R-12: sin token, o con uno vencido o revocado, es 401 (hay que iniciar sesion);
                // 403 queda solo para una sesion valida sin permiso para la accion.
                .exceptionHandling(e -> e.authenticationEntryPoint(sinSesion(objectMapper)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static AuthenticationEntryPoint sinSesion(ObjectMapper objectMapper) {
        return (request, response, ex) -> {
            ApiErrorResponse cuerpo = ApiErrorResponse.of(
                    HttpStatus.UNAUTHORIZED.value(),
                    HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                    "Inicia sesion para continuar",
                    request.getRequestURI());
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            objectMapper.writeValue(response.getOutputStream(), cuerpo);
        };
    }
}
