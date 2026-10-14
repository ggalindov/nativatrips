/**
 * Datos del páramo de Chingaza que rotan en la portada. Las cifras provienen
 * del material divulgativo de Parques Nacionales Naturales de Colombia.
 */
export interface DatoParamo {
  zona: string;
  titulo: string;
  cifra: string;
  detalle: string;
}

export const DATOS_PARAMO: readonly DatoParamo[] = [
  {
    zona: 'Flora',
    titulo: 'Un jardín a 3.000 metros',
    cifra: '+1.000 especies de flora',
    detalle: 'Encenillos, musgos, bromelias y frailejones atrapan la niebla y la convierten en agua.',
  },
  {
    zona: 'Frailejones',
    titulo: 'Sin prisa',
    cifra: '1 cm por año',
    detalle: 'Así crece un frailejón: uno de un metro tiene cerca de un siglo. Por eso no se tocan.',
  },
  {
    zona: 'Agua',
    titulo: 'Una fábrica de agua',
    cifra: '+10 millones de personas',
    detalle: 'Se benefician del agua que nace en las lagunas y turberas del parque.',
  },
  {
    zona: 'Fauna',
    titulo: 'Territorio del oso andino',
    cifra: '167 especies de mamíferos',
    detalle: 'Entre ellas el oso andino y el venado de cola blanca.',
  },
  {
    zona: 'Parque',
    titulo: 'Protegido desde 1977',
    cifra: '76.600 hectáreas',
    detalle: 'Parque Nacional Natural entre Cundinamarca y Meta.',
  },
];

/** Siguiente dato en la rotación circular. */
export function siguienteDato(actual: number, paso = 1): number {
  const n = DATOS_PARAMO.length;
  return (((actual + paso) % n) + n) % n;
}

const enteros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatearAltitud(metros: number): string {
  return enteros.format(metros);
}
