package com.nativatrips.backend.reservas.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nativatrips.backend.TestcontainersConfiguration;
import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.reservas.dto.IntegranteRequest;
import com.nativatrips.backend.reservas.dto.ReservaRequest;
import com.nativatrips.backend.reservas.model.EstadoReserva;
import com.nativatrips.backend.reservas.model.TipoGrupo;
import com.nativatrips.backend.reservas.repository.ReservaRepository;
import com.nativatrips.backend.senderos.model.NivelDificultad;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * BUG-01 (NAT-121): muchas reservas simultaneas por los ultimos cupos de un dia. Corre contra
 * PostgreSQL real porque el error solo aparece con transacciones concurrentes de verdad.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ReservaConcurrenciaTest {

    private static final int CUPO_DEL_DIA = 5;
    private static final int RESERVAS_SIMULTANEAS = 20;

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private SenderoRepository senderoRepository;

    @Autowired
    private CapacidadDiaRepository capacidadDiaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void nuncaSeVendeMasDelCupoDelDiaAunqueLleguenReservasSimultaneas() throws Exception {
        LocalDate fecha = LocalDate.now().plusDays(3);
        Sendero sendero = senderoRepository.save(new Sendero(
                "Sendero concurrencia", null, NivelDificultad.MODERADO, 120, "ECOTURISMO", null, new BigDecimal("45000")));
        UUID adminId = usuarioRepository.save(new Usuario(
                "admin-concurrencia-" + UUID.randomUUID() + "@ecopalacio.co", "hash", "Administrador", Rol.ADMINISTRADOR)).getId();
        capacidadDiaRepository.save(new CapacidadDia(sendero.getId(), fecha, CUPO_DEL_DIA, (short) 80, adminId));
        UUID turistaId = usuarioRepository.save(new Usuario(
                "concurrencia-" + UUID.randomUUID() + "@example.com", "hash", "Turista", Rol.TURISTA)).getId();

        List<Boolean> resultados = reservarAlMismoTiempo(sendero.getId(), fecha, turistaId);

        long aceptadas = resultados.stream().filter(Boolean::booleanValue).count();
        int ocupacion = reservaRepository.sumarPersonasActivas(
                sendero.getId(), fecha, List.of(EstadoReserva.PENDIENTE_PAGO, EstadoReserva.EN_REVISION, EstadoReserva.CONFIRMADA));

        assertThat(ocupacion).as("personas reservadas para el dia").isLessThanOrEqualTo(CUPO_DEL_DIA);
        assertThat(aceptadas).as("reservas aceptadas").isEqualTo(CUPO_DEL_DIA);
    }

    /** Lanza todas las reservas a la vez; cada una es de una persona. true = aceptada, false = rechazada por cupo. */
    private List<Boolean> reservarAlMismoTiempo(Long senderoId, LocalDate fecha, UUID turistaId) throws Exception {
        ExecutorService hilos = Executors.newFixedThreadPool(RESERVAS_SIMULTANEAS);
        CountDownLatch salida = new CountDownLatch(1);
        List<Future<Boolean>> pendientes = new ArrayList<>();
        try {
            for (int i = 0; i < RESERVAS_SIMULTANEAS; i++) {
                ReservaRequest request = new ReservaRequest(
                        senderoId, fecha, TipoGrupo.ESTANDAR, List.of(new IntegranteRequest("Visitante " + i, "CC" + i)));
                pendientes.add(hilos.submit(() -> {
                    salida.await();
                    try {
                        reservaService.crearReserva(request, turistaId);
                        return true;
                    } catch (BusinessRuleException cupoAgotado) {
                        return false;
                    }
                }));
            }
            salida.countDown();

            List<Boolean> resultados = new ArrayList<>();
            for (Future<Boolean> pendiente : pendientes) {
                resultados.add(pendiente.get(30, TimeUnit.SECONDS));
            }
            return resultados;
        } finally {
            hilos.shutdownNow();
        }
    }
}
