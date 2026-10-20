import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SesionEquipo } from '@/domain/equipo';
import { esRolEquipo } from '@/domain/equipo';

const CLAVE = 'nativatrips.sesion';

interface SesionContexto {
  sesion: SesionEquipo | null;
  abrir: (s: SesionEquipo) => void;
  cerrar: () => void;
}

const Contexto = createContext<SesionContexto | null>(null);

/** La sesión vive en sessionStorage: se cierra al cerrar la pestaña. */
export function leerSesionGuardada(): SesionEquipo | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const s = JSON.parse(crudo) as SesionEquipo;
    return s && typeof s.token === 'string' && esRolEquipo(s.rol) ? s : null;
  } catch {
    return null;
  }
}

export function SesionProvider({ children, inicial }: { children: ReactNode; inicial?: SesionEquipo | null }) {
  const [sesion, setSesion] = useState<SesionEquipo | null>(() => (inicial !== undefined ? inicial : leerSesionGuardada()));

  const abrir = useCallback((s: SesionEquipo) => {
    setSesion(s);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(s));
    } catch {
      /* sin almacenamiento disponible: la sesión dura lo que dure la página */
    }
  }, []);

  const cerrar = useCallback(() => {
    setSesion(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      /* nada que limpiar */
    }
  }, []);

  const valor = useMemo(() => ({ sesion, abrir, cerrar }), [sesion, abrir, cerrar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): SesionContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return c;
}
