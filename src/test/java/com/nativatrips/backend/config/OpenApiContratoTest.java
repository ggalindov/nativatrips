package com.nativatrips.backend.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.TestcontainersConfiguration;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Genera el contrato con la aplicacion completa y lo deja en target/openapi.json, que la CI publica
 * como artefacto: el contrato siempre corresponde al codigo de ese commit.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiContratoTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicaElContratoSinAutenticacionYLoGuarda() throws Exception {
        String contrato = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("NativaTrips API"))
                .andExpect(jsonPath("$.components.securitySchemes.bearerJwt.scheme").value("bearer"))
                .andExpect(jsonPath("$.paths['/api/v1/senderos']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/reservas']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/auth/login']").exists())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        Files.writeString(Path.of("target", "openapi.json"), contrato, StandardCharsets.UTF_8);
    }

    @Test
    void swaggerUiEsPublico() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
