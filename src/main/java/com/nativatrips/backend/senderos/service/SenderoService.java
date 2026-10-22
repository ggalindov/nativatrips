package com.nativatrips.backend.senderos.service;

import com.nativatrips.backend.common.archivos.AlmacenArchivos;
import com.nativatrips.backend.common.archivos.TipoArchivo;
import com.nativatrips.backend.common.exception.BusinessRuleException;
import com.nativatrips.backend.common.exception.ResourceNotFoundException;
import com.nativatrips.backend.senderos.dto.SenderoRequest;
import com.nativatrips.backend.senderos.dto.SenderoResponse;
import com.nativatrips.backend.senderos.model.FichaTecnica;
import com.nativatrips.backend.senderos.model.FotoSendero;
import com.nativatrips.backend.senderos.model.Sendero;
import com.nativatrips.backend.senderos.repository.FotoSenderoRepository;
import com.nativatrips.backend.senderos.repository.SenderoRepository;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Catalogo de senderos (RF-01, RF-02, RF-35). El publico solo ve los senderos activos y publicados;
 * el administrador ve todos, crea en borrador, publica cuando el sendero esta listo y, antes de dar
 * uno de baja, ve cuantas reservas futuras tiene.
 */
@Service
public class SenderoService {

    public static final String RESERVAS_FUTURAS = "RESERVAS_FUTURAS";
    static final int MAXIMO_FOTOS = 8;
    static final long MAXIMO_FOTO_BYTES = 5L * 1024 * 1024;
    private static final Set<TipoArchivo> FOTOS = Set.of(TipoArchivo.JPEG, TipoArchivo.PNG, TipoArchivo.WEBP);

    private final SenderoRepository senderoRepository;
    private final FotoSenderoRepository fotoRepository;
    private final AlmacenArchivos almacen;
    private final Clock reloj;

    public SenderoService(
            SenderoRepository senderoRepository, FotoSenderoRepository fotoRepository, AlmacenArchivos almacen, Clock reloj) {
        this.senderoRepository = senderoRepository;
        this.fotoRepository = fotoRepository;
        this.almacen = almacen;
        this.reloj = reloj;
    }

    @Transactional(readOnly = true)
    public List<SenderoResponse> listarActivos() {
        return conFotos(senderoRepository.findByActivoTrueAndPublicadoTrue());
    }

    /** RF-35: todo el catalogo para el editor del administrador, borradores y senderos de baja incluidos. */
    @Transactional(readOnly = true)
    public List<SenderoResponse> listarTodos() {
        return conFotos(senderoRepository.findAllByOrderByNombreAsc());
    }

    /** Ficha publica: un borrador o un sendero de baja no existe para el visitante. */
    @Transactional(readOnly = true)
    public SenderoResponse obtener(Long id) {
        Sendero sendero = buscarPorId(id);
        if (!sendero.isVisible()) {
            throw new ResourceNotFoundException("Sendero no encontrado");
        }
        return respuesta(sendero);
    }

    /** Un sendero nuevo nace en borrador. */
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
        sendero.setFicha(fichaDe(request));
        sendero.reemplazarDestacados(request.destacados());
        sendero.setPublicado(false);
        return respuesta(senderoRepository.save(sendero));
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
        sendero.setFicha(fichaDe(request));
        sendero.reemplazarDestacados(request.destacados());
        return respuesta(sendero);
    }

    /** Publicar exige lo que el turista necesita para decidir: descripcion y requisitos de ingreso. */
    @Transactional
    public SenderoResponse cambiarPublicacion(Long id, boolean publicar) {
        Sendero sendero = buscarPorId(id);
        if (publicar && (vacio(sendero.getDescripcion()) || vacio(sendero.getRequisitosIngreso()))) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT, "Para publicar el sendero completa la descripcion y los requisitos de ingreso");
        }
        sendero.setPublicado(publicar);
        if (publicar) {
            sendero.setActivo(true);
        }
        return respuesta(sendero);
    }

    /**
     * Da de baja el sendero. Si tiene reservas desde hoy y no viene la confirmacion, responde 409 con
     * cuantas son, para que el administrador decida con esa informacion; las reservas no se tocan.
     */
    @Transactional
    public void desactivar(Long id, long reservasFuturas, boolean confirmado) {
        Sendero sendero = buscarPorId(id);
        if (reservasFuturas > 0 && !confirmado) {
            throw new BusinessRuleException(
                    HttpStatus.CONFLICT,
                    "El sendero tiene " + reservasFuturas + " reserva(s) desde hoy. Confirma la baja; esas reservas"
                            + " siguen en pie y hay que atenderlas o reprogramarlas",
                    RESERVAS_FUTURAS,
                    Map.of("reservasFuturas", reservasFuturas));
        }
        sendero.setActivo(false);
    }

    @Transactional
    public SenderoResponse agregarFoto(Long id, MultipartFile archivo) {
        Sendero sendero = buscarPorId(id);
        int cantidad = fotoRepository.countBySenderoId(id);
        if (cantidad >= MAXIMO_FOTOS) {
            throw new BusinessRuleException(HttpStatus.CONFLICT, "Cada sendero tiene maximo " + MAXIMO_FOTOS + " fotos");
        }
        var guardada = almacen.guardar("fotos", archivo, FOTOS, MAXIMO_FOTO_BYTES);
        fotoRepository.save(new FotoSendero(id, guardada.ruta(), guardada.tipo().mediaType(), cantidad, reloj.instant()));
        return respuesta(sendero);
    }

    @Transactional
    public SenderoResponse borrarFoto(Long id, UUID fotoId) {
        FotoSendero foto = buscarFoto(id, fotoId);
        fotoRepository.delete(foto);
        almacen.borrar(foto.getRuta());
        return respuesta(buscarPorId(id));
    }

    public record Foto(byte[] contenido, String tipo) {
    }

    @Transactional(readOnly = true)
    public Foto foto(Long id, UUID fotoId) {
        FotoSendero foto = buscarFoto(id, fotoId);
        return new Foto(almacen.leer(foto.getRuta()), foto.getTipo());
    }

    private FotoSendero buscarFoto(Long senderoId, UUID fotoId) {
        return fotoRepository.findById(fotoId)
                .filter(f -> f.getSenderoId().equals(senderoId))
                .orElseThrow(() -> new ResourceNotFoundException("Foto no encontrada"));
    }

    private List<SenderoResponse> conFotos(List<Sendero> senderos) {
        Map<Long, List<String>> fotos = fotoRepository
                .findBySenderoIdInOrderByOrdenAsc(senderos.stream().map(Sendero::getId).toList()).stream()
                .collect(Collectors.groupingBy(
                        FotoSendero::getSenderoId, Collectors.mapping(SenderoService::url, Collectors.toList())));
        return senderos.stream().map(s -> SenderoResponse.from(s, fotos.getOrDefault(s.getId(), List.of()))).toList();
    }

    private SenderoResponse respuesta(Sendero sendero) {
        return SenderoResponse.from(sendero, fotoRepository.findBySenderoIdOrderByOrdenAsc(sendero.getId()).stream()
                .map(SenderoService::url)
                .toList());
    }

    private static String url(FotoSendero foto) {
        return "/api/v1/senderos/" + foto.getSenderoId() + "/fotos/" + foto.getId();
    }

    private static boolean vacio(String texto) {
        return texto == null || texto.isBlank();
    }

    private static FichaTecnica fichaDe(SenderoRequest request) {
        return new FichaTecnica(
                request.distanciaKm(),
                request.desnivelM(),
                request.altitudMaxM(),
                request.sector(),
                request.horaSalida(),
                request.puntoEncuentro());
    }

    private Sendero buscarPorId(Long id) {
        return senderoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sendero no encontrado"));
    }
}
