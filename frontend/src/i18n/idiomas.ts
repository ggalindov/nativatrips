/** Idiomas del sitio. El español es el idioma base del contenido. */
export type Idioma = 'es' | 'en' | 'fr' | 'pt';

export interface DatosIdioma {
  codigo: Idioma;
  /** Nombre del idioma en su propia lengua, como se muestra en el selector. */
  nombre: string;
  /** Configuración regional para fechas, números y moneda. */
  locale: string;
}

export const IDIOMAS: readonly DatosIdioma[] = [
  { codigo: 'es', nombre: 'Español', locale: 'es-CO' },
  { codigo: 'en', nombre: 'English', locale: 'en-US' },
  { codigo: 'fr', nombre: 'Français', locale: 'fr-FR' },
  { codigo: 'pt', nombre: 'Português', locale: 'pt-BR' },
];

export const IDIOMA_BASE: Idioma = 'es';

export function esIdioma(valor: unknown): valor is Idioma {
  return IDIOMAS.some((i) => i.codigo === valor);
}

export function datosIdioma(idioma: Idioma): DatosIdioma {
  return IDIOMAS.find((i) => i.codigo === idioma) ?? IDIOMAS[0];
}

/** Primer idioma soportado entre las preferencias del navegador; si no hay ninguno, español. */
export function detectarIdioma(preferencias: readonly string[]): Idioma {
  for (const p of preferencias) {
    const base = p.toLowerCase().split('-')[0];
    if (esIdioma(base)) return base;
  }
  return IDIOMA_BASE;
}
