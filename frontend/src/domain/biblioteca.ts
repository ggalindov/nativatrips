/** Biblioteca de fotos y videos del páramo que alimenta la galería y el carrusel. */
export type CategoriaMedio = 'Paisaje' | 'Flora' | 'Fauna' | 'Experiencias';

export const CATEGORIAS_MEDIO: readonly CategoriaMedio[] = ['Paisaje', 'Flora', 'Fauna', 'Experiencias'];

export interface ElementoBiblioteca {
  id: string;
  tipo: 'foto' | 'video';
  /** Archivo en tamaño completo (foto) o el video. */
  src: string;
  /** Versión reducida para cuadrículas y carrusel (en video, el póster). */
  miniatura: string;
  ancho: number;
  alto: number;
  alt: string;
  categoria: CategoriaMedio;
  /** Autor o titular de los derechos. */
  credito: string;
  /** Licencia o "Propia" si el contenido es del operador. */
  licencia: string;
  /** Si es contenido propio, aparece primero. */
  propio: boolean;
}

export function filtrarPorCategoria(medios: readonly ElementoBiblioteca[], categoria: CategoriaMedio | null): ElementoBiblioteca[] {
  return categoria === null ? [...medios] : medios.filter((m) => m.categoria === categoria);
}

/** Contenido propio primero; luego videos antes que fotos para dar movimiento al carrusel. */
export function ordenarBiblioteca(medios: readonly ElementoBiblioteca[]): ElementoBiblioteca[] {
  const peso = (m: ElementoBiblioteca) => (m.propio ? 0 : 2) + (m.tipo === 'video' ? 0 : 1);
  return [...medios].sort((a, b) => peso(a) - peso(b));
}

export function contarPorCategoria(medios: readonly ElementoBiblioteca[]): Record<CategoriaMedio, number> {
  const cuenta = { Paisaje: 0, Flora: 0, Fauna: 0, Experiencias: 0 };
  for (const m of medios) cuenta[m.categoria]++;
  return cuenta;
}

/** Siguiente índice en un recorrido circular (visor y carrusel). */
export function indiceCircular(actual: number, paso: number, total: number): number {
  if (total <= 0) return 0;
  return (((actual + paso) % total) + total) % total;
}
