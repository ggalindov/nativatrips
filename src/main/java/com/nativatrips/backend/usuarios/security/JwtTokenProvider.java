package com.nativatrips.backend.usuarios.security;

import com.nativatrips.backend.config.JwtProperties;
import com.nativatrips.backend.usuarios.model.Rol;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    void init() {
        String secret = jwtProperties.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET no esta configurado. Generalo con: openssl rand -base64 32 "
                            + "y definelo en tu .env antes de arrancar la aplicacion.");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "APP_JWT_SECRET debe tener al menos 256 bits (32 bytes); el actual tiene "
                            + keyBytes.length + " bytes.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generarToken(UUID usuarioId, String email, Rol rol) {
        Instant ahora = Instant.now();
        Instant expira = ahora.plus(jwtProperties.getExpirationMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(usuarioId.toString())
                .claim("email", email)
                .claim("rol", rol.name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(expira))
                .signWith(signingKey)
                .compact();
    }

    /**
     * @throws JwtException si el token esta mal formado, mal firmado o expiro.
     */
    public Claims validarYObtenerClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID obtenerUsuarioId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public Rol obtenerRol(Claims claims) {
        return Rol.valueOf(claims.get("rol", String.class));
    }
}
