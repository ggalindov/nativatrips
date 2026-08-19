package com.nativatrips.backend.usuarios.dto;

import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String email,
        String nombreCompleto,
        Rol rol,
        boolean activo) {

    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getRol(),
                usuario.isActivo());
    }
}
