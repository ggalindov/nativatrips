/**
 * Seguimiento de la primera carga del sitio. Cada recurso que hace falta para
 * mostrar la página (fuentes, documento, código de la página abierta) se
 * registra como tarea, y la pantalla de carga avanza según las que terminan.
 */

type Oyente = () => void;

let total = 0;
let hechas = 0;
let cerrada = false;
const oyentes = new Set<Oyente>();

function avisar() {
  oyentes.forEach((oyente) => oyente());
}

/** Registra una tarea de la primera carga. Una tarea que falla también cuenta como terminada. */
export function registrarCarga(tarea: Promise<unknown>) {
  if (cerrada) return;
  total += 1;
  avisar();
  const terminar = () => {
    hechas += 1;
    avisar();
  };
  tarea.then(terminar, terminar);
}

export function estadoCarga() {
  return { total, hechas, completa: hechas >= total };
}

export function suscribirCarga(oyente: Oyente) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Después de la primera carga, las páginas que se descargan ya no afectan a la pantalla de carga. */
export function cerrarCarga() {
  cerrada = true;
}

/** Solo para pruebas. */
export function reiniciarCarga() {
  total = 0;
  hechas = 0;
  cerrada = false;
}

/** El recorrido completo dura al menos esto, para que la subida se alcance a ver. */
export const DURACION_MINIMA_MS = 1600;
/** Desde aquí se avisa que la conexión parece lenta. */
export const AVISO_LENTO_MS = 8000;
/** Desde aquí se ofrece entrar sin esperar a que termine la carga. */
export const OFRECER_ENTRAR_MS = 20000;

/**
 * Hasta dónde puede subir el excursionista. Las tareas terminadas fijan un
 * piso; mientras falta algo sigue avanzando despacio hacia la cima sin
 * alcanzarla, y solo llega al 100 % cuando todo terminó.
 */
export function techoDeAvance(fraccionHecha: number, completa: boolean, tiempoMs: number): number {
  if (completa) return 1;
  const espera = (1 - fraccionHecha) * 0.8 * (1 - Math.exp(-tiempoMs / 6000));
  return Math.min(0.96, fraccionHecha + espera);
}

/** Paso de un cuadro: se acerca suavemente al techo, sin superar el ritmo mínimo de la subida. */
export function siguienteAvance(actual: number, techo: number, tiempoMs: number): number {
  const limiteTiempo = Math.min(1, tiempoMs / DURACION_MINIMA_MS);
  const objetivo = Math.min(techo, limiteTiempo);
  if (objetivo <= actual) return actual;
  const paso = (objetivo - actual) * 0.12;
  return objetivo - actual < 0.002 ? objetivo : actual + paso;
}

export type AvisoCarga = 'ninguno' | 'lento' | 'sin-conexion';

export function avisoDeCarga(tiempoMs: number, completa: boolean, enLinea: boolean): AvisoCarga {
  if (completa) return 'ninguno';
  if (!enLinea) return 'sin-conexion';
  return tiempoMs >= AVISO_LENTO_MS ? 'lento' : 'ninguno';
}
