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

/** Recomendación de ropa según la temperatura estimada. */
export function capasRecomendadas(temperaturaC: number): string {
  if (temperaturaC <= 6) return 'Térmica, polar grueso, chaqueta impermeable, guantes y gorro.';
  if (temperaturaC <= 10) return 'Térmica, polar e impermeable; guantes en la mañana.';
  return 'Camiseta transpirable y polar ligero; lleva el impermeable en el morral.';
}

export interface ElementoEquipaje {
  id: string;
  nombre: string;
  categoria: 'Ropa' | 'Equipo' | 'Comida y agua' | 'Documentos';
  obligatorio: boolean;
}

export const EQUIPAJE: readonly ElementoEquipaje[] = [
  { id: 'impermeable', nombre: 'Chaqueta impermeable', categoria: 'Ropa', obligatorio: true },
  { id: 'polar', nombre: 'Polar o chaqueta térmica', categoria: 'Ropa', obligatorio: true },
  { id: 'botas', nombre: 'Botas con agarre', categoria: 'Ropa', obligatorio: true },
  { id: 'guantes', nombre: 'Guantes y gorro', categoria: 'Ropa', obligatorio: false },
  { id: 'morral', nombre: 'Morral de 20 a 30 litros', categoria: 'Equipo', obligatorio: true },
  { id: 'bloqueador', nombre: 'Bloqueador solar y gafas', categoria: 'Equipo', obligatorio: true },
  { id: 'bastones', nombre: 'Bastones de caminata', categoria: 'Equipo', obligatorio: false },
  { id: 'agua', nombre: 'Agua (mínimo 1,5 litros)', categoria: 'Comida y agua', obligatorio: true },
  { id: 'snacks', nombre: 'Snacks de energía', categoria: 'Comida y agua', obligatorio: false },
  { id: 'documento', nombre: 'Documento de identidad', categoria: 'Documentos', obligatorio: true },
  { id: 'reserva', nombre: 'Código de la reserva', categoria: 'Documentos', obligatorio: true },
];

export function progresoEquipaje(marcados: ReadonlySet<string>): { total: number; listos: number; pct: number; faltanObligatorios: number } {
  const listos = EQUIPAJE.filter((e) => marcados.has(e.id)).length;
  const faltanObligatorios = EQUIPAJE.filter((e) => e.obligatorio && !marcados.has(e.id)).length;
  return { total: EQUIPAJE.length, listos, pct: Math.round((listos / EQUIPAJE.length) * 100), faltanObligatorios };
}
