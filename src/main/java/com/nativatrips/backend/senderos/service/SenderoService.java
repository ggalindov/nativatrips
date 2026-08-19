package com.nativatrips.backend.senderos.service;

import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.dto.SenderoRequest;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SenderoService {

    private final SenderoRepository senderoRepository;

    public SenderoService(SenderoRepository senderoRepository) {
        this.senderoRepository = senderoRepository;
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> listarActivos() {
        return senderoRepository.findByActivoTrue().stream()
                .map(SenderoResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SenderoResponse obtener(Long id) {
        return SenderoResponse.from(buscarPorId(id));
    }

    @Transactional
    public SenderoResponse crear(SenderoRequest request) {
        Sendero sendero = new Sendero(
                request.nombre(),
                request.descripcion(),
                request.nivelDificultad(),
                request.duracionMinutos(),
                request.tipoExperiencia(),
                request.requisitosIngreso(),
                request.precio());
        return SenderoResponse.from(senderoRepository.save(sendero));
    }

    @Transactional
    public SenderoResponse actualizar(Long id, SenderoRequest request) {
        Sendero sendero = buscarPorId(id);
        sendero.setNombre(request.nombre());
        sendero.setDescripcion(request.descripcion());
        sendero.setNivelDificultad(request.nivelDificultad());
        sendero.setDuracionMinutos(request.duracionMinutos());
        sendero.setTipoExperiencia(request.tipoExperiencia());
        sendero.setRequisitosIngreso(request.requisitosIngreso());
        sendero.setPrecio(request.precio());
        return SenderoResponse.from(sendero);
    }

    @Transactional
    public void desactivar(Long id) {
        Sendero sendero = buscarPorId(id);
        sendero.setActivo(false);
    }

    private Sendero buscarPorId(Long id) {
        return senderoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));
    }
}
