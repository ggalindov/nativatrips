/**
 * Países para la nacionalidad y el indicativo del celular. Se guardan con su
 * código ISO 3166-1 alfa-2; el nombre se muestra en el idioma del visitante
 * con Intl.DisplayNames, así que no hay que traducirlo a mano.
 */
export interface Pais {
  codigo: string;
  /** Indicativo internacional sin el signo +. */
  indicativo: string;
}

export const COLOMBIA = 'CO';

export const PAISES: readonly Pais[] = [
  { codigo: 'CO', indicativo: '57' },
  // América
  { codigo: 'AR', indicativo: '54' }, { codigo: 'BO', indicativo: '591' }, { codigo: 'BR', indicativo: '55' },
  { codigo: 'CA', indicativo: '1' }, { codigo: 'CL', indicativo: '56' }, { codigo: 'CR', indicativo: '506' },
  { codigo: 'CU', indicativo: '53' }, { codigo: 'DO', indicativo: '1' }, { codigo: 'EC', indicativo: '593' },
  { codigo: 'SV', indicativo: '503' }, { codigo: 'US', indicativo: '1' }, { codigo: 'GT', indicativo: '502' },
  { codigo: 'HN', indicativo: '504' }, { codigo: 'MX', indicativo: '52' }, { codigo: 'NI', indicativo: '505' },
  { codigo: 'PA', indicativo: '507' }, { codigo: 'PY', indicativo: '595' }, { codigo: 'PE', indicativo: '51' },
  { codigo: 'PR', indicativo: '1' }, { codigo: 'UY', indicativo: '598' }, { codigo: 'VE', indicativo: '58' },
  // Europa
  { codigo: 'DE', indicativo: '49' }, { codigo: 'AT', indicativo: '43' }, { codigo: 'BE', indicativo: '32' },
  { codigo: 'DK', indicativo: '45' }, { codigo: 'ES', indicativo: '34' }, { codigo: 'FI', indicativo: '358' },
  { codigo: 'FR', indicativo: '33' }, { codigo: 'GR', indicativo: '30' }, { codigo: 'IE', indicativo: '353' },
  { codigo: 'IT', indicativo: '39' }, { codigo: 'NO', indicativo: '47' }, { codigo: 'NL', indicativo: '31' },
  { codigo: 'PL', indicativo: '48' }, { codigo: 'PT', indicativo: '351' }, { codigo: 'GB', indicativo: '44' },
  { codigo: 'CZ', indicativo: '420' }, { codigo: 'SE', indicativo: '46' }, { codigo: 'CH', indicativo: '41' },
  { codigo: 'UA', indicativo: '380' }, { codigo: 'RU', indicativo: '7' },
  // Asia, África y Oceanía
  { codigo: 'AU', indicativo: '61' }, { codigo: 'CN', indicativo: '86' }, { codigo: 'KR', indicativo: '82' },
  { codigo: 'AE', indicativo: '971' }, { codigo: 'IN', indicativo: '91' }, { codigo: 'IL', indicativo: '972' },
  { codigo: 'JP', indicativo: '81' }, { codigo: 'MA', indicativo: '212' }, { codigo: 'NZ', indicativo: '64' },
  { codigo: 'ZA', indicativo: '27' }, { codigo: 'TR', indicativo: '90' },
];

export function esExtranjero(nacionalidad: string): boolean {
  return nacionalidad !== COLOMBIA;
}

export function indicativoDe(codigo: string): string {
  return PAISES.find((p) => p.codigo === codigo)?.indicativo ?? '57';
}

/** Bandera emoji a partir del código ISO (🇨🇴, 🇫🇷…). */
export function bandera(codigo: string): string {
  if (!/^[A-Z]{2}$/.test(codigo)) return '🏳️';
  return String.fromCodePoint(...[...codigo].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * Países ordenados por su nombre en el idioma activo, con Colombia primero.
 * Si el navegador no tiene Intl.DisplayNames, se usa el código.
 */
export function paisesOrdenados(locale: string): { codigo: string; nombre: string; indicativo: string }[] {
  const nombres = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([locale], { type: 'region' }) : null;
  const nombre = (c: string) => nombres?.of(c) ?? c;
  const [colombia, ...resto] = PAISES;
  return [colombia, ...[...resto].sort((a, b) => nombre(a.codigo).localeCompare(nombre(b.codigo), locale))].map((p) => ({
    ...p,
    nombre: nombre(p.codigo),
  }));
}
