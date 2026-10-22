package com.nativatrips.backend.capacidad.service;

import com.nativatrips.backend.capacidad.model.CapacidadDia;
import com.nativatrips.backend.capacidad.repository.CapacidadDiaRepository;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.time.Clock;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Solo en el perfil dev: publica capacidad para la ventana de reserva (ADR-008) en los dias que
 * falten, para poder reservar en local sin cargarla a mano. En produccion la carga el administrador.
 */
@Component
@Profile("dev")
@Order(Ordered.LOWEST_PRECEDENCE)
public class CapacidadDemo implements ApplicationRunner {

    static final int CUPO_DEMO = 30;

    private static final Logger log = LoggerFactory.getLogger(CapacidadDemo.class);

    private final CapacidadDiaRepository capacidadDiaRepository;
    private final SenderoRepository senderoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CapacidadService capacidadService;
    private final Clock reloj;

    public CapacidadDemo(
            CapacidadDiaRepository capacidadDiaRepository,
            SenderoRepository senderoRepository,
            UsuarioRepository usuarioRepository,
            CapacidadService capacidadService,
            Clock reloj) {
        this.capacidadDiaRepository = capacidadDiaRepository;
        this.senderoRepository = senderoRepository;
        this.usuarioRepository = usuarioRepository;
        this.capacidadService = capacidadService;
        this.reloj = reloj;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        var admin = usuarioRepository.findByRolAndActivoTrue(Rol.ADMINISTRADOR).stream().findFirst();
        if (admin.isEmpty()) {
            log.warn("Sin administrador: no se publica capacidad de demostracion");
            return;
        }
        LocalDate hasta = capacidadService.ultimoDiaReservable();
        int creados = 0;
        for (Sendero sendero : senderoRepository.findByActivoTrueAndPublicadoTrue()) {
            for (LocalDate dia = LocalDate.now(reloj); !dia.isAfter(hasta); dia = dia.plusDays(1)) {
                if (capacidadDiaRepository.findBySenderoIdAndFecha(sendero.getId(), dia).isEmpty()) {
                    capacidadDiaRepository.save(new CapacidadDia(
                            sendero.getId(), dia, CUPO_DEMO, CapacidadService.UMBRAL_ALERTA_POR_DEFECTO,
                            admin.get().getId()));
                    creados++;
                }
            }
        }
        log.info("Capacidad de demostracion: {} dias publicados hasta el {}", creados, hasta);
    }
}
