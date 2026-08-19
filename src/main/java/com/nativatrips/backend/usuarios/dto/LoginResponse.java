package com.nativatrips.backend.usuarios.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresInMinutes,
        UsuarioResponse usuario) {

    public static LoginResponse of(String accessToken, long expiresInMinutes, UsuarioResponse usuario) {
        return new LoginResponse(accessToken, "Bearer", expiresInMinutes, usuario);
    }
}
