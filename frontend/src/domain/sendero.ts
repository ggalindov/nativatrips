export type Dificultad = 'Fácil' | 'Moderado' | 'Difícil' | 'Exigente';

export const DIFICULTADES: readonly Dificultad[] = ['Fácil', 'Moderado', 'Difícil', 'Exigente'];

export interface Sendero {
  id: string;
  nombre: string;
  dificultad: Dificultad;
  /** Duración estimada en horas. */
  duracionHoras: number;
  /** Distancia del recorrido en kilómetros; null si aún no está registrada. */
  distanciaKm: number | null;
  horaSalida: string;
  sector: string | null;
  /** Desnivel positivo acumulado en metros. */
  desnivelM: number | null;
  /** Altitud máxima del recorrido en m s. n. m. */
  altitudMaxM: number | null;
  /** Tarifa por persona en pesos colombianos. */
  precioPorPersona: number | null;
  descripcion: string;
  destacados: string[];
  puntoEncuentro: string | null;
}

const ORDEN_DIFICULTAD: Record<Dificultad, number> = { Fácil: 0, Moderado: 1, Difícil: 2, Exigente: 3 };

/** Ordena de menor a mayor exigencia y, a igual dificultad, por duración. */
export function ordenarPorExigencia(senderos: readonly Sendero[]): Sendero[] {
  return [...senderos].sort(
    (a, b) => ORDEN_DIFICULTAD[a.dificultad] - ORDEN_DIFICULTAD[b.dificultad] || a.duracionHoras - b.duracionHoras,
  );
}

export function filtrarPorDificultad(senderos: readonly Sendero[], dificultad: Dificultad | null): Sendero[] {
  return dificultad === null ? [...senderos] : senderos.filter((s) => s.dificultad === dificultad);
}

/** Búsqueda sin distinguir mayúsculas ni tildes, por nombre, sector o puntos destacados. */
export function buscarSenderos(senderos: readonly Sendero[], texto: string): Sendero[] {
  const normalizar = (v: string) => v.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const q = normalizar(texto.trim());
  if (!q) return [...senderos];
  return senderos.filter((s) =>
    [s.nombre, s.sector ?? '', ...s.destacados].some((campo) => normalizar(campo).includes(q)),
  );
}

const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const enteros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatearDuracion(horas: number): string {
  return `${decimal.format(horas)} h`;
}

export function formatearDistancia(km: number | null): string {
  return km === null ? '—' : `${decimal.format(km)} km`;
}

export function formatearMetros(m: number | null): string {
  return m === null ? '—' : `${enteros.format(m)} m`;
}

export function formatearPesos(valor: number | null): string {
  return valor === null ? 'Por confirmar' : pesos.format(valor).replace(/\s/g, ' ');
}

/** Total de una reserva; null si el sendero aún no tiene tarifa. */
export function totalReserva(sendero: Pick<Sendero, 'precioPorPersona'>, personas: number): number | null {
  return sendero.precioPorPersona === null ? null : sendero.precioPorPersona * Math.max(0, personas);
}
