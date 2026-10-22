import { ErrorServicio } from '../puertos';
import type { CodigoError } from '../puertos';

export interface OpcionesCliente {
  baseUrl: string;
  /** Idioma activo; viaja en Accept-Language para que el servidor responda en él. */
  idioma: () => string;
  /** Token de la sesión del equipo, si la hay. */
  token?: () => string | null;
  /** El servidor rechazó el token (vencido o revocado): la interfaz debe olvidar la sesión. */
  alSesionInvalida?: () => void;
  /** En el páramo la señal es débil: pasado este tiempo la petición se corta. */
  tiempoLimiteMs?: number;
  fetch?: typeof fetch;
}

export interface ClienteHttp {
  pedir<T>(ruta: string, init?: RequestInit): Promise<T>;
  /** Descarga un archivo (soportes de reprogramación) con la sesión del equipo. */
  pedirArchivo(ruta: string): Promise<Blob>;
  /**
   * Abre un flujo de Server-Sent Events con la sesión del equipo y entrega cada evento. Si la
   * conexión se corta, vuelve a conectarse sola. Devuelve la función para cerrarlo.
   */
  escuchar(ruta: string, alEvento: (nombre: string, datos: string) => void): () => void;
}

interface ErrorApi {
  message?: string;
  codigo?: string;
  detalles?: Record<string, unknown>;
}

export const TIEMPO_LIMITE_MS = 15_000;
const REINTENTO_EVENTOS_MS = 5_000;

/** Códigos de error del servidor que la interfaz sabe explicar en el idioma de la persona. */
const CODIGOS_SERVIDOR: Record<string, CodigoError> = {
  ENLACE_INVALIDO: 'enlaceInvalido',
  CUPO_AGOTADO: 'sinCupos',
  CUPO_INSUFICIENTE: 'sinCupos',
  TIPO_NO_PERMITIDO: 'archivoNoPermitido',
  RESERVAS_FUTURAS: 'reservasFuturas',
};

/** Código de error que la interfaz traduce, según el estado HTTP. */
function codigoPara(estado: number, cuerpo: ErrorApi | null): CodigoError | null {
  const delServidor = cuerpo?.codigo ? CODIGOS_SERVIDOR[cuerpo.codigo] : undefined;
  if (delServidor) return delServidor;
  if (estado === 400) return 'datosInvalidos';
  if (estado === 401) return 'credenciales';
  if (estado === 413 || estado === 415) return 'archivoNoPermitido';
  if (estado >= 500) return 'servidor';
  return null;
}

export function crearClienteHttp({
  baseUrl,
  idioma,
  token,
  alSesionInvalida,
  tiempoLimiteMs = TIEMPO_LIMITE_MS,
  fetch: hacerFetch = globalThis.fetch.bind(globalThis),
}: OpcionesCliente): ClienteHttp {
  const cabecerasPara = (init?: RequestInit, acepta = 'application/json') => {
    const cabeceras = new Headers(init?.headers);
    cabeceras.set('Accept', acepta);
    cabeceras.set('Accept-Language', idioma());
    // Con FormData el navegador pone el Content-Type con su separador de partes.
    if (init?.body !== undefined && !(init.body instanceof FormData)) cabeceras.set('Content-Type', 'application/json');
    const sesion = token?.();
    if (sesion) cabeceras.set('Authorization', `Bearer ${sesion}`);
    return { cabeceras, sesion };
  };

  const enviar = async (ruta: string, init: RequestInit | undefined, acepta?: string): Promise<Response> => {
    const { cabeceras, sesion } = cabecerasPara(init, acepta);
    const corte = new AbortController();
    const temporizador = setTimeout(() => corte.abort(), tiempoLimiteMs);
    let respuesta: Response;
    try {
      respuesta = await hacerFetch(`${baseUrl}${ruta}`, { ...init, headers: cabeceras, signal: corte.signal });
    } catch {
      throw new ErrorServicio('No hay conexión con el servidor.', 'sinConexion');
    } finally {
      clearTimeout(temporizador);
    }

    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as ErrorApi | null;
      if (respuesta.status === 401 && sesion) {
        alSesionInvalida?.();
        throw new ErrorServicio(cuerpo?.message ?? 'La sesión venció.', 'sesionVencida');
      }
      throw new ErrorServicio(
        cuerpo?.message ?? `El servidor respondió ${respuesta.status}.`,
        codigoPara(respuesta.status, cuerpo),
        cuerpo?.detalles ?? {},
      );
    }
    return respuesta;
  };

  return {
    async pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
      const respuesta = await enviar(ruta, init);
      // 202 y 204 llegan sin cuerpo.
      const texto = await respuesta.text();
      return (texto ? JSON.parse(texto) : undefined) as T;
    },

    async pedirArchivo(ruta: string): Promise<Blob> {
      return (await enviar(ruta, undefined, '*/*')).blob();
    },

    escuchar(ruta, alEvento) {
      let activo = true;
      let corte: AbortController | null = null;

      const conectar = async () => {
        while (activo) {
          corte = new AbortController();
          try {
            const { cabeceras } = cabecerasPara(undefined, 'text/event-stream');
            const respuesta = await hacerFetch(`${baseUrl}${ruta}`, { headers: cabeceras, signal: corte.signal });
            if (respuesta.status === 401) {
              alSesionInvalida?.();
              return;
            }
            if (!respuesta.ok || !respuesta.body) throw new Error(`eventos ${respuesta.status}`);
            await leerEventos(respuesta.body, alEvento);
          } catch {
            // Señal perdida o servidor reiniciado: se reintenta abajo.
          }
          if (activo) await new Promise((r) => setTimeout(r, REINTENTO_EVENTOS_MS));
        }
      };
      void conectar();

      return () => {
        activo = false;
        corte?.abort();
      };
    },
  };
}

/** Lee un flujo text/event-stream y entrega cada evento con su nombre y sus datos. */
export async function leerEventos(cuerpo: ReadableStream<Uint8Array>, alEvento: (nombre: string, datos: string) => void) {
  const lector = cuerpo.getReader();
  const decodificador = new TextDecoder();
  let pendiente = '';
  for (;;) {
    const { value, done } = await lector.read();
    if (done) return;
    pendiente += decodificador.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let fin = pendiente.indexOf('\n\n');
    while (fin !== -1) {
      const bloque = pendiente.slice(0, fin);
      pendiente = pendiente.slice(fin + 2);
      let nombre = 'message';
      const datos: string[] = [];
      for (const linea of bloque.split('\n')) {
        if (linea.startsWith('event:')) nombre = linea.slice(6).trim();
        else if (linea.startsWith('data:')) datos.push(linea.slice(5).trimStart());
      }
      if (datos.length > 0) alEvento(nombre, datos.join('\n'));
      fin = pendiente.indexOf('\n\n');
    }
  }
}
