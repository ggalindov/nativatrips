package com.nativatrips.backend.usuarios;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.notificaciones.service.NotificacionService;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** HU-14 criterio 6 (NAT-92) de punta a punta: el bloqueo se guarda aunque el login responda 401. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class BloqueoPorIntentosTest {

    private static final String CLAVE = "clave-segura-123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void cincoIntentosFallidosBloqueanLaCuentaAunqueLuegoLlegueLaClaveCorrecta() throws Exception {
        String correo = crearAdministrador("bloqueo");

        for (int i = 0; i < 5; i++) {
            iniciarSesion(correo, "clave-equivocada").andExpect(status().isUnauthorized());
        }

        iniciarSesion(correo, CLAVE)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Credenciales invalidas o acceso bloqueado temporalmente por intentos fallidos"));
        assertThat(usuarioRepository.findByEmail(correo).orElseThrow().getBloqueadoHasta()).isNotNull();
    }

    @Test
    void recuperarLaClavePorCorreoLevantaElBloqueo() throws Exception {
        String correo = crearAdministrador("recupera");
        for (int i = 0; i < 5; i++) {
            iniciarSesion(correo, "clave-equivocada").andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/v1/auth/olvide-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + correo + "\"}"))
                .andExpect(status().isAccepted());
        ArgumentCaptor<String> cuerpo = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarCorreo(eq(correo), anyString(), cuerpo.capture());
        String token = cuerpo.getValue().replaceAll("(?s).*recuperar\\?token=([A-Za-z0-9_-]+).*", "$1");
        mockMvc.perform(post("/api/v1/auth/restablecer-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\": \"" + token + "\", \"nuevaPassword\": \"clave-nueva-456\"}"))
                .andExpect(status().isNoContent());

        iniciarSesion(correo, "clave-nueva-456").andExpect(status().isOk());
    }

    private String crearAdministrador(String prefijo) {
        String correo = "admin-" + prefijo + "-" + UUID.randomUUID() + "@ecopalacio.co";
        usuarioRepository.save(new Usuario(correo, passwordEncoder.encode(CLAVE), "Administrador", Rol.ADMINISTRADOR));
        return correo;
    }

    private ResultActions iniciarSesion(String correo, String clave) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"" + correo + "\", \"password\": \"" + clave + "\"}"));
    }
}
