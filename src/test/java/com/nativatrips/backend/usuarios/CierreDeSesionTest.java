package com.nativatrips.backend.usuarios;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

/** BUG-02 (NAT-122) de punta a punta: despues del logout el mismo token ya no abre el panel. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CierreDeSesionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void despuesDeCerrarSesionElMismoTokenEsRechazado() throws Exception {
        String correo = "admin-logout-" + UUID.randomUUID() + "@ecopalacio.co";
        usuarioRepository.save(new Usuario(correo, passwordEncoder.encode("clave-segura-123"), "Administrador", Rol.ADMINISTRADOR));
        String token = iniciarSesion(correo, "clave-segura-123");

        mockMvc.perform(get("/api/v1/capacidad")
                        .param("desde", "2026-10-26")
                        .param("hasta", "2026-11-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/capacidad")
                        .param("desde", "2026-10-26")
                        .param("hasta", "2026-11-01")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cerrarSesionDeUnTokenNoAfectaOtraSesionDeLaMismaCuenta() throws Exception {
        String correo = "admin-dos-sesiones-" + UUID.randomUUID() + "@ecopalacio.co";
        usuarioRepository.save(new Usuario(correo, passwordEncoder.encode("clave-segura-123"), "Administrador", Rol.ADMINISTRADOR));
        String celular = iniciarSesion(correo, "clave-segura-123");
        String computador = iniciarSesion(correo, "clave-segura-123");

        mockMvc.perform(post("/api/v1/auth/logout").header("Authorization", "Bearer " + celular))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/capacidad")
                        .param("desde", "2026-10-26")
                        .param("hasta", "2026-11-01")
                        .header("Authorization", "Bearer " + computador))
                .andExpect(status().isOk());
    }

    private String iniciarSesion(String correo, String clave) throws Exception {
        String respuesta = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"" + correo + "\", \"password\": \"" + clave + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.accessToken");
    }
}
