package com.nativatrips.backend.usuarios.security;

import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.service.RevocacionTokens;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Construye la Authentication directamente de los claims del JWT (email, rol) sin volver
 * a consultar la base de datos en cada request. Un token invalido/expirado simplemente deja
 * la request como no autenticada; Spring Security responde 401/403 segun corresponda. Un token
 * revocado con logout recibe el mismo trato (BUG-02).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final RevocacionTokens revocacionTokens;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, RevocacionTokens revocacionTokens) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.revocacionTokens = revocacionTokens;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            String token = header.substring(BEARER_PREFIX.length());
            try {
                Claims claims = jwtTokenProvider.validarYObtenerClaims(token);
                if (revocacionTokens.estaRevocado(jwtTokenProvider.obtenerJti(claims))) {
                    throw new IllegalArgumentException("Token revocado");
                }
                UUID usuarioId = jwtTokenProvider.obtenerUsuarioId(claims);
                Rol rol = jwtTokenProvider.obtenerRol(claims);
                String email = claims.get("email", String.class);

                AuthenticatedUser principal = new AuthenticatedUser(usuarioId, email, rol);
                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));

                var authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
