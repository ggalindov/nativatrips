package com.nativatrips.backend.senderos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.reservas.ReservasDePrueba;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RF-01: la disponibilidad responde en menos de 3 segundos. Mide lo que hace el portal al abrir el
 * catalogo y la ficha de cada sendero (13 senderos, 14 dias de calendario con reservas), contra
 * PostgreSQL real. El resultado queda en el registro de la prueba como evidencia.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RendimientoCatalogoTest {

    private static final Duration LIMITE = Duration.ofSeconds(3);
    private static final Logger log = LoggerFactory.getLogger(RendimientoCatalogoTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private CapacidadDiaRepository capacidadDiaRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final List<Long> senderos = new ArrayList<>();

    @BeforeEach
    void setUp() {
        UUID adminId = usuarioRepository.save(new Usuario(
                "admin-rendimiento-" + UUID.randomUUID() + "@ecopalacio.co", "h", "Admin", Rol.ADMINISTRADOR)).getId();
        LocalDate hoy = LocalDate.now();
        for (int i = 0; i < 13; i++) {
            Long id = senderoRepository.save(new Sendero(
                    "Rendimiento " + i + " " + UUID.randomUUID(), "Recorrido", NivelDificultad.MODERADO, 240, "ECOTURISMO",
                    "Documento", new BigDecimal("150000"))).getId();
            senderos.add(id);
            for (int d = 0; d < 14; d++) {
                capacidadDiaRepository.save(new CapacidadDia(id, hoy.plusDays(d), 30, (short) 80, adminId));
                var reserva = ReservasDePrueba.reserva(id, hoy.plusDays(d), 4, null);
                reserva.setEstado(EstadoReserva.CONFIRMADA);
                reservaRepository.save(reserva);
            }
        }
    }

    @Test
    void elCatalogoYElCalendarioDeCadaSenderoRespondenEnMenosDeTresSegundos() throws Exception {
        LocalDate hoy = LocalDate.now();
        mockMvc.perform(get("/api/v1/senderos")).andExpect(status().isOk());

        long inicio = System.nanoTime();
        mockMvc.perform(get("/api/v1/senderos")).andExpect(status().isOk());
        Duration catalogo = Duration.ofNanos(System.nanoTime() - inicio);

        Duration peorCalendario = Duration.ZERO;
        for (Long id : senderos) {
            long t = System.nanoTime();
            mockMvc.perform(get("/api/v1/senderos/" + id + "/calendario").param("desde", hoy.toString()).param("dias", "14"))
                    .andExpect(status().isOk());
            Duration d = Duration.ofNanos(System.nanoTime() - t);
            peorCalendario = d.compareTo(peorCalendario) > 0 ? d : peorCalendario;
        }

        log.info("RF-01 catalogo: {} ms; peor calendario de 14 dias: {} ms", catalogo.toMillis(), peorCalendario.toMillis());
        assertThat(catalogo).isLessThan(LIMITE);
        assertThat(peorCalendario).isLessThan(LIMITE);
    }
}
