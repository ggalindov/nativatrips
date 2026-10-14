import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { en } from './diccionarios/en';
import { es } from './diccionarios/es';
import type { Diccionario } from './diccionarios/es';
import { fr } from './diccionarios/fr';
import { pt } from './diccionarios/pt';
import { crearFormato } from './formato';
import type { Formato } from './formato';
import { datosIdioma, detectarIdioma, esIdioma } from './idiomas';
import type { Idioma } from './idiomas';

const DICCIONARIOS: Record<Idioma, Diccionario> = { es, en, fr, pt };
const CLAVE = 'nativatrips.idioma';

interface IdiomaContexto {
  idioma: Idioma;
  locale: string;
  /** Textos del idioma activo. */
  t: Diccionario;
  /** Formatos de moneda, números y fechas del idioma activo. */
  f: Formato;
  cambiar: (idioma: Idioma) => void;
}

const Contexto = createContext<IdiomaContexto | null>(null);

/** Idioma guardado por la persona o, la primera vez, el del navegador. */
function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (esIdioma(guardado)) return guardado;
  } catch {
    /* sin almacenamiento: se usa el del navegador */
  }
  return typeof navigator === 'undefined' ? 'es' : detectarIdioma(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

/**
 * `fijo` mantiene un idioma sin guardarlo: lo usa el área del equipo, que
 * trabaja en español aunque el visitante haya elegido otro idioma.
 */
export function IdiomaProvider({ children, inicial, fijo = false }: { children: ReactNode; inicial?: Idioma; fijo?: boolean }) {
  const [idioma, setIdioma] = useState<Idioma>(() => inicial ?? idiomaInicial());

  const cambiar = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo);
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      /* la elección dura solo esta visita */
    }
  }, []);

  useEffect(() => {
    const anterior = document.documentElement.lang;
    document.documentElement.lang = idioma;
    return () => {
      if (fijo) document.documentElement.lang = anterior;
    };
  }, [idioma, fijo]);

  const valor = useMemo<IdiomaContexto>(() => {
    const { locale } = datosIdioma(idioma);
    return { idioma, locale, t: DICCIONARIOS[idioma], f: crearFormato(locale), cambiar };
  }, [idioma, cambiar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useIdioma(): IdiomaContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error('useIdioma debe usarse dentro de IdiomaProvider');
  return c;
}
