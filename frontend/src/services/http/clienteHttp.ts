import { ErrorServicio } from '../puertos';
import type { CodigoError } from '../puertos';

export interface OpcionesCliente {
  baseUrl: string;
  /** Idioma activo; viaja en Accept-Language para que el servidor responda en él. */
  idioma: () => string;
  /** Token de la sesión del equipo, si la hay. */
  token?: () => string | null;
  /** En el páramo la señal es débil: pasado este tiempo la petición se corta. */
  tiempoLimiteMs?: number;
  fetch?: typeof fetch;
}

export interface ClienteHttp {
  pedir<T>(ruta: string, init?: RequestInit): Promise<T>;
}

interface ErrorApi {
  message?: string;
}

export const TIEMPO_LIMITE_MS = 15_000;

/** Código de error que la interfaz traduce, según el estado HTTP. */
function codigoPara(estado: number): CodigoError | null {
  if (estado === 400) return 'datosInvalidos';
  if (estado === 401) return 'credenciales';
  if (estado >= 500) return 'servidor';
  return null;
}

export function crearClienteHttp({
  baseUrl,
  idioma,
  token,
  tiempoLimiteMs = TIEMPO_LIMITE_MS,
  fetch: hacerFetch = globalThis.fetch.bind(globalThis),
}: OpcionesCliente): ClienteHttp {
  return {
    async pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
      const cabeceras = new Headers(init?.headers);
      cabeceras.set('Accept', 'application/json');
      cabeceras.set('Accept-Language', idioma());
      if (init?.body !== undefined) cabeceras.set('Content-Type', 'application/json');
      const sesion = token?.();
      if (sesion) cabeceras.set('Authorization', `Bearer ${sesion}`);

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
        throw new ErrorServicio(cuerpo?.message ?? `El servidor respondió ${respuesta.status}.`, codigoPara(respuesta.status));
      }
      if (respuesta.status === 204) return undefined as T;
      return (await respuesta.json()) as T;
    },
  };
}
