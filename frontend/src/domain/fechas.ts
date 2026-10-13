const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function aFecha(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Fecha local de hoy en formato ISO (AAAA-MM-DD), sin desfase de zona horaria. */
export function hoyIso(ahora: Date = new Date()): string {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function sumarDias(iso: string, dias: number): string {
  const d = aFecha(iso);
  d.setDate(d.getDate() + dias);
  return hoyIso(d);
}

export function diaSemana(iso: string): string {
  return DIAS[aFecha(iso).getDay()];
}

export function diaDelMes(iso: string): number {
  return aFecha(iso).getDate();
}

/** "16/10/2026" */
export function formatearFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "vie 16/10" */
export function formatearFechaCorta(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${diaSemana(iso)} ${d}/${m}`;
}
