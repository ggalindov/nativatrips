/**
 * Ascenso por el páramo de la portada: el scroll lleva a una persona desde el
 * bosque altoandino hasta la cumbre, y en cada tramo se muestra un dato del
 * parque. Las cifras provienen del material divulgativo de Parques
 * Nacionales Naturales de Colombia sobre el PNN Chingaza.
 */
export const ALTITUD_INICIO = 3000;
export const ALTITUD_CUMBRE = 3900;

export interface Hito {
  altitud: number;
  zona: string;
  titulo: string;
  cifra: string;
  detalle: string;
}

export const HITOS: readonly Hito[] = [
  {
    altitud: 3000,
    zona: 'Bosque altoandino',
    titulo: 'Donde empieza el páramo',
    cifra: '+1.000 especies de flora',
    detalle: 'Encenillos, musgos y bromelias atrapan la niebla y la convierten en agua.',
  },
  {
    altitud: 3250,
    zona: 'Subpáramo',
    titulo: 'Frailejones sin prisa',
    cifra: '1 cm por año',
    detalle: 'Así crece un frailejón: uno de un metro tiene cerca de un siglo. Por eso no se tocan.',
  },
  {
    altitud: 3500,
    zona: 'Lagunas',
    titulo: 'Una fábrica de agua',
    cifra: '+10 millones de personas',
    detalle: 'Se benefician del agua que nace en las lagunas y turberas del parque.',
  },
  {
    altitud: 3700,
    zona: 'Pajonal',
    titulo: 'Territorio del oso andino',
    cifra: '167 especies de mamíferos',
    detalle: 'Entre ellas el oso andino y el venado de cola blanca.',
  },
  {
    altitud: 3900,
    zona: 'Cumbre',
    titulo: 'Llegaste a lo más alto del recorrido',
    cifra: '76.600 hectáreas protegidas',
    detalle: 'Parque Nacional Natural desde 1977, entre Cundinamarca y Meta.',
  },
];

export function limitarProgreso(progreso: number): number {
  if (Number.isNaN(progreso)) return 0;
  return Math.min(1, Math.max(0, progreso));
}

export function altitudPorProgreso(progreso: number): number {
  return Math.round(ALTITUD_INICIO + limitarProgreso(progreso) * (ALTITUD_CUMBRE - ALTITUD_INICIO));
}

/** Progreso (0 a 1) en el que se alcanza cada hito. */
export function progresoDeHito(indice: number): number {
  return (HITOS[indice].altitud - ALTITUD_INICIO) / (ALTITUD_CUMBRE - ALTITUD_INICIO);
}

/** Hito más cercano a la altitud actual: siempre hay uno que mostrar. */
export function indiceHito(progreso: number): number {
  const altitud = altitudPorProgreso(progreso);
  let mejor = 0;
  HITOS.forEach((h, i) => {
    if (Math.abs(h.altitud - altitud) < Math.abs(HITOS[mejor].altitud - altitud)) mejor = i;
  });
  return mejor;
}

const enteros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatearAltitud(metros: number): string {
  return enteros.format(metros);
}
