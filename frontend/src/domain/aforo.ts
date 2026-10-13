/** Umbral a partir del cual una fecha se marca en alerta (igual al del backend). */
export const UMBRAL_ALERTA = 0.8;

export type NivelAforo = 'disponible' | 'alerta' | 'lleno';

export interface Disponibilidad {
  /** Fecha en formato ISO (AAAA-MM-DD). */
  fecha: string;
  limite: number;
  ocupados: number;
}

export function cuposLibres(d: Disponibilidad): number {
  return Math.max(0, d.limite - d.ocupados);
}

export function porcentajeOcupacion(d: Disponibilidad): number {
  if (d.limite <= 0) return 100;
  return Math.min(100, Math.round((d.ocupados / d.limite) * 100));
}

export function nivelAforo(d: Disponibilidad): NivelAforo {
  if (cuposLibres(d) === 0) return 'lleno';
  return d.ocupados / d.limite >= UMBRAL_ALERTA ? 'alerta' : 'disponible';
}

/** Personas que se pueden reservar para la fecha: nunca más que los cupos libres. */
export function ajustarPersonas(personas: number, d: Disponibilidad): number {
  const libres = cuposLibres(d);
  if (libres === 0) return 0;
  return Math.min(libres, Math.max(1, Math.trunc(personas)));
}
