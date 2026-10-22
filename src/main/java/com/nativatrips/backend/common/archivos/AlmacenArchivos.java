package com.nativatrips.backend.common.archivos;

import com.nativatrips.backend.common.exception.BusinessRuleException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Guarda en disco los archivos que suben el equipo y los turistas (fotos de senderos, soportes de
 * reprogramacion). Cada archivo recibe un nombre aleatorio dentro de su carpeta, asi que el nombre
 * que trae el usuario nunca llega al sistema de archivos. En el compose la carpeta es un volumen.
 */
@Component
public class AlmacenArchivos {

    public static final String TIPO_NO_PERMITIDO = "TIPO_NO_PERMITIDO";

    private final Path raiz;

    public AlmacenArchivos(@Value("${app.archivos.directorio:./datos/archivos}") String directorio) {
        this.raiz = Path.of(directorio).toAbsolutePath().normalize();
    }

    public record ArchivoGuardado(String ruta, TipoArchivo tipo, long tamano) {
    }

    /**
     * @param carpeta subcarpeta fija del codigo ("fotos", "soportes"), nunca un dato del usuario
     * @throws BusinessRuleException si el archivo esta vacio, pesa mas de lo permitido o no es de un tipo aceptado
     */
    public ArchivoGuardado guardar(String carpeta, MultipartFile archivo, Set<TipoArchivo> permitidos, long maximoBytes) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BusinessRuleException(HttpStatus.BAD_REQUEST, "Adjunta el archivo");
        }
        if (archivo.getSize() > maximoBytes) {
            throw new BusinessRuleException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "El archivo pesa mas de " + maximoBytes / (1024 * 1024) + " MB");
        }
        try {
            byte[] contenido = archivo.getBytes();
            TipoArchivo tipo = TipoArchivo.detectar(contenido)
                    .filter(permitidos::contains)
                    .orElseThrow(() -> new BusinessRuleException(
                            HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Ese tipo de archivo no se acepta", TIPO_NO_PERMITIDO, null));
            String ruta = carpeta + "/" + UUID.randomUUID() + "." + tipo.extension();
            Path destino = resolver(ruta);
            Files.createDirectories(destino.getParent());
            Files.write(destino, contenido);
            return new ArchivoGuardado(ruta, tipo, contenido.length);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo guardar el archivo", e);
        }
    }

    public byte[] leer(String ruta) {
        try {
            return Files.readAllBytes(resolver(ruta));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo", e);
        }
    }

    public void borrar(String ruta) {
        try {
            Files.deleteIfExists(resolver(ruta));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo borrar el archivo", e);
        }
    }

    private Path resolver(String ruta) {
        Path destino = raiz.resolve(ruta).normalize();
        if (!destino.startsWith(raiz)) {
            throw new IllegalArgumentException("Ruta fuera del almacen");
        }
        return destino;
    }
}
