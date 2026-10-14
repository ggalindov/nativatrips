/**
 * Estimación de temperatura por altitud con el gradiente térmico vertical
 * medio de la atmósfera (≈ 0,65 °C por cada 100 m). Es una referencia para
 * preparar la ropa, no un pronóstico.
 */
export const GRADIENTE_POR_100M = 0.65;

/** Referencia: Bogotá, a 2.600 m, con 14 °C de media. */
export const REFERENCIA = { altitudM: 2600, temperaturaC: 14 } as const;

export function temperaturaEstimada(altitudM: number, referencia = REFERENCIA): number {
  // En décimas de grado y con enteros, para no arrastrar errores de punto flotante.
  const decimas = referencia.temperaturaC * 10 - ((altitudM - referencia.altitudM) * GRADIENTE_POR_100M * 100) / 1000;
  return Math.round(decimas) / 10;
}

/** Nivel de abrigo según la temperatura estimada; la interfaz lo describe en cada idioma. */
export type Capas = 'frio' | 'fresco' | 'templado';

export function capasRecomendadas(temperaturaC: number): Capas {
  if (temperaturaC <= 6) return 'frio';
  if (temperaturaC <= 10) return 'fresco';
  return 'templado';
}

export type CategoriaEquipaje = 'Ropa' | 'Equipo' | 'Comida y agua' | 'Documentos';

export const CATEGORIAS_EQUIPAJE: readonly CategoriaEquipaje[] = ['Ropa', 'Equipo', 'Comida y agua', 'Documentos'];

/** Elemento del morral; su nombre visible sale del diccionario por `id`. */
export interface ElementoEquipaje {
  id: string;
  categoria: CategoriaEquipaje;
  obligatorio: boolean;
}

export const EQUIPAJE: readonly ElementoEquipaje[] = [
  { id: 'impermeable', categoria: 'Ropa', obligatorio: true },
  { id: 'polar', categoria: 'Ropa', obligatorio: true },
  { id: 'botas', categoria: 'Ropa', obligatorio: true },
  { id: 'guantes', categoria: 'Ropa', obligatorio: false },
  { id: 'morral', categoria: 'Equipo', obligatorio: true },
  { id: 'bloqueador', categoria: 'Equipo', obligatorio: true },
  { id: 'bastones', categoria: 'Equipo', obligatorio: false },
  { id: 'agua', categoria: 'Comida y agua', obligatorio: true },
  { id: 'snacks', categoria: 'Comida y agua', obligatorio: false },
  { id: 'documento', categoria: 'Documentos', obligatorio: true },
  { id: 'reserva', categoria: 'Documentos', obligatorio: true },
];

export function progresoEquipaje(marcados: ReadonlySet<string>): { total: number; listos: number; pct: number; faltanObligatorios: number } {
  const listos = EQUIPAJE.filter((e) => marcados.has(e.id)).length;
  const faltanObligatorios = EQUIPAJE.filter((e) => e.obligatorio && !marcados.has(e.id)).length;
  return { total: EQUIPAJE.length, listos, pct: Math.round((listos / EQUIPAJE.length) * 100), faltanObligatorios };
}
