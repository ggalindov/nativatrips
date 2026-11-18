import { pantallaPequena } from '@/ui/conexion';

/**
 * Precarga de medios pesados durante la pantalla de carga. El archivo se
 * descarga entero una sola vez y queda en memoria como `blob:`, así el video
 * arranca sin cortes al llegar a su sección, incluso con mala señal.
 */

type Oyente = () => void;

const listos = new Map<string, string>();
const noDisponibles = new Set<string>();
const enCurso = new Map<string, Promise<void>>();
const oyentes = new Set<Oyente>();

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

export const VIDEO_PAISAJES = {
  pequeno: '/media/chingaza-paisajes-480.mp4',
  grande: '/media/chingaza-paisajes.mp4',
} as const;

/** Celulares y pantallas angostas reciben la versión de 480p. */
export function fuenteVideoPaisajes(): string {
  return pantallaPequena() ? VIDEO_PAISAJES.pequeno : VIDEO_PAISAJES.grande;
}

/** Tiempo máximo que la pantalla de carga espera un medio; después sigue bajando en segundo plano. */
export const ESPERA_MAXIMA_MEDIO_MS = 15000;

function descargar(url: string, tipo: string): Promise<void> {
  return fetch(url)
    .then((respuesta) => {
      const contenido = respuesta.headers.get('content-type') ?? '';
      // Si el archivo no existe, el servidor puede responder con la página del sitio: eso no es un video.
      if (!respuesta.ok || !contenido.startsWith(tipo)) throw new Error(`Medio no disponible: ${url}`);
      return respuesta.blob();
    })
    .then((archivo) => {
      listos.set(url, URL.createObjectURL(archivo));
    })
    .catch(() => {
      noDisponibles.add(url);
    })
    .finally(avisar);
}

/**
 * Descarga el medio y se resuelve cuando está listo, cuando se sabe que no
 * existe o cuando pasa la espera máxima, lo que ocurra primero. Nunca falla.
 */
export function precargarMedio(url: string, { tipo = 'video/', esperaMaximaMs = ESPERA_MAXIMA_MEDIO_MS } = {}): Promise<void> {
  let descarga = enCurso.get(url);
  if (!descarga) {
    descarga = descargar(url, tipo);
    enCurso.set(url, descarga);
  }
  const limite = new Promise<void>((resolver) => setTimeout(resolver, esperaMaximaMs));
  return Promise.race([descarga, limite]);
}

/** Dirección `blob:` del medio ya descargado, o `undefined` si todavía no está. */
export function medioPrecargado(url: string): string | undefined {
  return listos.get(url);
}

/** El servidor respondió que el medio no existe: mejor mostrar la imagen fija. */
export function medioNoDisponible(url: string): boolean {
  return noDisponibles.has(url);
}

export function suscribirMedios(oyente: Oyente) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Solo para pruebas. */
export function reiniciarMedios() {
  listos.forEach((url) => URL.revokeObjectURL?.(url));
  listos.clear();
  noDisponibles.clear();
  enCurso.clear();
}
