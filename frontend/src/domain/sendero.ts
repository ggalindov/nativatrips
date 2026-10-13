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

const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

export function formatearDuracion(horas: number): string {
  return `${decimal.format(horas)} h`;
}

export function formatearDistancia(km: number | null): string {
  return km === null ? '—' : `${decimal.format(km)} km`;
}
