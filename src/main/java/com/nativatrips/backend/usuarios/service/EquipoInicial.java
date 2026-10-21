package com.nativatrips.backend.usuarios.service;

import com.nativatrips.backend.common.seguridad.TokenSeguro;
import com.nativatrips.backend.usuarios.model.Rol;
import com.nativatrips.backend.usuarios.model.Usuario;
import com.nativatrips.backend.usuarios.repository.UsuarioRepository;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cuentas del equipo al primer arranque: los correos llegan por configuracion
 * (APP_EQUIPO_ADMINISTRADORES y APP_EQUIPO_GUIAS) y cada cuenta nueva recibe el enlace para crear
 * su contrasena. Ninguna clave vive en el repositorio, que es publico. Las cuentas que ya existen no
 * se tocan.
 */
@Component
public class EquipoInicial implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EquipoInicial.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;
    private final List<String> administradores;
    private final List<String> guias;

    public EquipoInicial(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetService passwordResetService,
            @Value("${app.equipo.administradores:}") List<String> administradores,
            @Value("${app.equipo.guias:}") List<String> guias) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.administradores = administradores;
        this.guias = guias;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        administradores.forEach(correo -> crearSiFalta(correo, Rol.ADMINISTRADOR));
        guias.forEach(correo -> crearSiFalta(correo, Rol.GUIA_TURISTICO));
    }

    void crearSiFalta(String correoCrudo, Rol rol) {
        String correo = correoCrudo == null ? "" : correoCrudo.trim().toLowerCase(Locale.ROOT);
        if (correo.isEmpty() || usuarioRepository.existsByEmail(correo)) {
            return;
        }
        // Clave aleatoria que nadie conoce: la cuenta solo se abre con el enlace del correo.
        usuarioRepository.save(new Usuario(
                correo, passwordEncoder.encode(TokenSeguro.generar()), correo.substring(0, correo.indexOf('@')), rol));
        passwordResetService.solicitarRestablecimiento(correo);
        log.info("Cuenta {} creada para {}; se envio el enlace para crear la contrasena", rol,
                correo.charAt(0) + "***" + correo.substring(correo.indexOf('@')));
    }
}
