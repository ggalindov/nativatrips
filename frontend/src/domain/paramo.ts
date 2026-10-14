/**
 * Rotación de los datos del páramo en la portada. Los textos de cada dato
 * están en los diccionarios de idioma (`paramo.datos`); las cifras provienen
 * del material divulgativo de Parques Nacionales Naturales de Colombia.
 */
export const TOTAL_DATOS_PARAMO = 5;

/** Siguiente dato en la rotación circular. */
export function siguienteDato(actual: number, paso = 1, total = TOTAL_DATOS_PARAMO): number {
  return (((actual + paso) % total) + total) % total;
}
