package com.nativatrips.backend.panel.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class AvisosDeOperacionTest {

    private final EventosPanel eventos = mock(EventosPanel.class);
    private final NotificacionService correo = mock(NotificacionService.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final AvisosDeOperacion avisos = new AvisosDeOperacion(eventos, correo, usuarios);

    private final CapacidadDia dia = new CapacidadDia(1L, LocalDate.of(2026, 10, 24), 20, (short) 80, UUID.randomUUID());
    private final Sendero sendero =
            new Sendero("Lagunas de Siecha", null, NivelDificultad.MODERADO, 300, "ECOTURISMO", null, BigDecimal.TEN);

    @BeforeEach
    void setUp() {
        given(usuarios.findByRolAndActivoTrue(Rol.ADMINISTRADOR))
                .willReturn(List.of(new Usuario("admin@ecopalacio.co", "hash", "Admin", Rol.ADMINISTRADOR)));
    }

    @Test
    void laReservaQueCruzaElOchentaPorCientoAvisaAlPanelYPorCorreo() {
        avisos.siCruzaElUmbral(dia, sendero, 14, 17);

        ArgumentCaptor<Object> alerta = ArgumentCaptor.forClass(Object.class);
        verify(eventos).publicar(eq("aforo"), alerta.capture());
        assertThat(alerta.getValue()).isInstanceOfSatisfying(AvisosDeOperacion.AlertaAforo.class, a -> {
            assertThat(a.porcentaje()).isEqualTo(85);
            assertThat(a.ocupacion()).isEqualTo(17);
            assertThat(a.umbral()).isEqualTo(80);
        });
        verify(correo).enviarCorreo(eq("admin@ecopalacio.co"), contains("85 %"), contains("17 de 20"));
    }

    @Test
    void siYaEstabaPorEncimaDelUmbralNoSeRepiteElAviso() {
        avisos.siCruzaElUmbral(dia, sendero, 16, 18);

        verify(eventos, never()).publicar(anyString(), any());
        verify(correo, never()).enviarCorreo(anyString(), anyString(), anyString());
    }

    @Test
    void siSigueDebajoDelUmbralNoHayAviso() {
        avisos.siCruzaElUmbral(dia, sendero, 5, 15);

        verify(eventos, never()).publicar(anyString(), any());
    }
}
