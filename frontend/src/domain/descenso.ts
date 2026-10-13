/**
 * El scroll de la portada representa un descenso por el paramo: el progreso
 * (0 a 1) se traduce en una altitud y en una de cuatro etapas del recorrido.
 */
export const ALTITUD_CUMBRE = 3900;
export const ALTITUD_LAGUNA = 3250;

export interface Etapa {
  nombre: string;
  texto: string;
}

export const ETAPAS: readonly Etapa[] = [
  { nombre: 'Cumbre', texto: 'Desde aquí se ve el valle. El viento sopla del oriente.' },
  { nombre: 'Niebla', texto: 'Entre los 3.700 y los 3.500 m la nube se queda quieta.' },
  { nombre: 'Frailejonal', texto: 'Los frailejones crecen cerca de un centímetro al año. No se tocan.' },
  { nombre: 'Laguna', texto: 'El agua que baja de aquí abastece a buena parte de Bogotá.' },
];

export function limitarProgreso(progreso: number): number {
  if (Number.isNaN(progreso)) return 0;
  return Math.min(1, Math.max(0, progreso));
}

export function altitudPorProgreso(progreso: number): number {
  const p = limitarProgreso(progreso);
  return Math.round(ALTITUD_CUMBRE - p * (ALTITUD_CUMBRE - ALTITUD_LAGUNA));
}

export function indiceEtapa(progreso: number): number {
  const p = limitarProgreso(progreso);
  return Math.min(ETAPAS.length - 1, Math.floor(p * ETAPAS.length));
}

/** Opacidad de la niebla: máxima en el segundo tramo y nula en los extremos. */
export function opacidadNiebla(progreso: number): number {
  const p = limitarProgreso(progreso);
  return Math.max(0, 1 - Math.abs(p - 0.35) / 0.3);
}

const enteros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatearAltitud(metros: number): string {
  return enteros.format(metros);
}
