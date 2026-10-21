package com.nativatrips.backend.usuarios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.util.List;
import org.assertj.core.groups.Tuple;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

class EquipoInicialTest {

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final PasswordEncoder encoder = mock(PasswordEncoder.class);
    private final PasswordResetService recuperacion = mock(PasswordResetService.class);

    @Test
    void creaCadaCuentaConSuRolYLeEnviaElEnlaceParaCrearLaClave() {
        given(encoder.encode(anyString())).willReturn("hash");
        new EquipoInicial(usuarios, encoder, recuperacion, List.of(" Admin@EcoPalacio.co "), List.of("guia@ecopalacio.co"))
                .run(null);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(Usuario::getEmail, Usuario::getRol).containsExactly(
                Tuple.tuple("admin@ecopalacio.co", Rol.ADMINISTRADOR),
                Tuple.tuple("guia@ecopalacio.co", Rol.GUIA_TURISTICO));
        verify(recuperacion).solicitarRestablecimiento("admin@ecopalacio.co");
        verify(recuperacion).solicitarRestablecimiento("guia@ecopalacio.co");
    }

    @Test
    void unaCuentaQueYaExisteNoSeToca() {
        given(usuarios.existsByEmail("admin@ecopalacio.co")).willReturn(true);
        new EquipoInicial(usuarios, encoder, recuperacion, List.of("admin@ecopalacio.co"), List.of()).run(null);

        verify(usuarios, never()).save(any());
        verify(recuperacion, never()).solicitarRestablecimiento(anyString());
    }

    @Test
    void sinCorreosConfiguradosNoHaceNada() {
        new EquipoInicial(usuarios, encoder, recuperacion, List.of(), List.of("")).run(null);

        verify(usuarios, never()).save(any());
    }
}
