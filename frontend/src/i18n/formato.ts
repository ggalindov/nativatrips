/**
 * Formatos que dependen del idioma: moneda (siempre pesos colombianos),
 * números, fechas y días de la semana.
 */
export interface Formato {
  pesos(valor: number): string;
  entero(valor: number): string;
  decimal(valor: number): string;
  /** "16/10/2026" en español, "10/16/2026" en inglés… */
  fecha(iso: string): string;
  /** "vie 16/10" */
  fechaCorta(iso: string): string;
  /** "jueves, 16 de octubre de 2026" */
  fechaLarga(iso: string): string;
  /** Abreviatura del día de la semana: "vie", "Fri", "ven.", "sex." */
  diaSemana(iso: string): string;
  /** "octubre de 2026" */
  mes(isoMes: string): string;
  hora(fechaHora: Date): string;
}

const aFecha = (iso: string) => new Date(`${iso}T12:00:00`);

export function crearFormato(locale: string): Formato {
  const pesos = new Intl.NumberFormat(locale, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const entero = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const fecha = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const diaMes = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit' });
  const larga = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dia = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const mes = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const hora = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const diaSemana = (iso: string) => dia.format(aFecha(iso)).replace(/\.$/, '');
  return {
    pesos: (v) => pesos.format(v).replace(/\s/g, ' '),
    entero: (v) => entero.format(v),
    decimal: (v) => decimal.format(v),
    fecha: (iso) => fecha.format(aFecha(iso)),
    fechaCorta: (iso) => `${diaSemana(iso)} ${diaMes.format(aFecha(iso))}`,
    fechaLarga: (iso) => larga.format(aFecha(iso)),
    diaSemana,
    mes: (isoMes) => mes.format(aFecha(`${isoMes}-15`)),
    hora: (d) => hora.format(d),
  };
}
