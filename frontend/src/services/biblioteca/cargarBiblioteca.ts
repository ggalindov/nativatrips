import { FOTOS, foto } from '@/contenido/fotos';
import type { IdFoto } from '@/contenido/fotos';
import type { CategoriaMedio, ElementoBiblioteca } from '@/domain/biblioteca';
import { CATEGORIAS_MEDIO, ordenarBiblioteca } from '@/domain/biblioteca';

/** Catálogo del contenido propio, generado por scripts/importar-biblioteca.sh. */
export const RUTA_CATALOGO_PROPIO = '/biblioteca/biblioteca.json';

const CATEGORIA_FOTO: Partial<Record<IdFoto, CategoriaMedio>> = {
  'flor-frailejon': 'Flora',
  frailejon: 'Flora',
  'flor-bejaria': 'Flora',
  'la-arboleda': 'Flora',
  venado: 'Fauna',
  'pato-paramuno': 'Fauna',
  rana: 'Fauna',
  'camino-niebla': 'Experiencias',
  'capilla-niebla': 'Experiencias',
  suasie: 'Experiencias',
};

/** Fotos con licencia libre de Wikimedia Commons, acreditadas en /creditos. */
export function fotosConLicencia(): ElementoBiblioteca[] {
  return (Object.keys(FOTOS) as IdFoto[]).map((id) => {
    const f = foto(id);
    return {
      id: `commons-${id}`,
      tipo: 'foto',
      src: f.src,
      miniatura: f.srcPequena,
      ancho: f.ancho,
      alto: f.alto,
      alt: f.alt,
      categoria: CATEGORIA_FOTO[id] ?? 'Paisaje',
      credito: f.autor,
      licencia: f.licencia,
      propio: false,
    };
  });
}

function esElemento(v: unknown): v is ElementoBiblioteca {
  const e = v as ElementoBiblioteca;
  return (
    !!e && typeof e.id === 'string' && (e.tipo === 'foto' || e.tipo === 'video') && typeof e.src === 'string' &&
    typeof e.miniatura === 'string' && CATEGORIAS_MEDIO.includes(e.categoria)
  );
}

/** Contenido propio importado; si aún no hay catálogo, la biblioteca sigue con las fotos con licencia. */
export async function contenidoPropio(): Promise<ElementoBiblioteca[]> {
  try {
    const r = await fetch(RUTA_CATALOGO_PROPIO);
    if (!r.ok) return [];
    const datos: unknown = await r.json();
    return Array.isArray(datos) ? datos.filter(esElemento).map((e) => ({ ...e, propio: true })) : [];
  } catch {
    return [];
  }
}

export async function cargarBiblioteca(): Promise<ElementoBiblioteca[]> {
  return ordenarBiblioteca([...(await contenidoPropio()), ...fotosConLicencia()]);
}
