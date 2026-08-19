package com.nativatrips.backend.usuarios.security;

import com.nativatrips.backend.usuarios.model.Rol;
import java.util.UUID;

/** Principal ligero derivado directamente de los claims del JWT, sin volver a consultar la BD por request. */
public record AuthenticatedUser(UUID id, String email, Rol rol) {
}
