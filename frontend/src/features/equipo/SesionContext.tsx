import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { SesionEquipo } from '@/domain/equipo';
import { esRolEquipo } from '@/domain/equipo';

const CLAVE = 'nativatrips.sesion';

/** Lo emite el cliente HTTP cuando el servidor rechaza el token (vencido o revocado). */
export const EVENTO_SESION_INVALIDA = 'nativatrips:sesion-invalida';

interface SesionContexto {
  sesion: SesionEquipo | null;
  /** La última sesión terminó sola (venció o el servidor la rechazó), no porque la persona saliera. */
  vencida: boolean;
  abrir: (s: SesionEquipo) => void;
  cerrar: () => void;
}

const Contexto = createContext<SesionContexto | null>(null);

/**
 * Momento (ms) en que vence el JWT según su campo `exp`, o null si el token no
 * es un JWT legible (los datos en memoria usan tokens de demostración).
 */
export function vencimientoDelToken(token: string): number | null {
  try {
    const carga = token.split('.')[1];
    if (!carga) return null;
    const json = atob(carga.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function olvidarGuardada() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que limpiar */
  }
}

/** La sesión vive en sessionStorage: se cierra al cerrar la pestaña. Una sesión vencida no se recupera. */
export function leerSesionGuardada(): SesionEquipo | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    if (!crudo) return null;
    const s = JSON.parse(crudo) as SesionEquipo;
    if (!s || typeof s.token !== 'string' || !esRolEquipo(s.rol)) return null;
    const vence = vencimientoDelToken(s.token);
    if (vence !== null && vence <= Date.now()) {
      olvidarGuardada();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function SesionProvider({ children, inicial }: { children: ReactNode; inicial?: SesionEquipo | null }) {
  const [sesion, setSesion] = useState<SesionEquipo | null>(() => (inicial !== undefined ? inicial : leerSesionGuardada()));
  const [vencida, setVencida] = useState(false);

  const abrir = useCallback((s: SesionEquipo) => {
    setSesion(s);
    setVencida(false);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(s));
    } catch {
      /* sin almacenamiento disponible: la sesión dura lo que dure la página */
    }
  }, []);

  const cerrar = useCallback(() => {
    setSesion(null);
    olvidarGuardada();
  }, []);

  const expirar = useCallback(() => {
    setSesion(null);
    setVencida(true);
    olvidarGuardada();
  }, []);

  // El servidor rechazó el token: revocado desde otra pestaña, vencido o cuenta bloqueada.
  useEffect(() => {
    window.addEventListener(EVENTO_SESION_INVALIDA, expirar);
    return () => window.removeEventListener(EVENTO_SESION_INVALIDA, expirar);
  }, [expirar]);

  // El JWT trae su vencimiento: al llegar, la sesión se cierra sin esperar a una petición fallida.
  useEffect(() => {
    if (!sesion) return;
    const vence = vencimientoDelToken(sesion.token);
    if (vence === null) return;
    const temporizador = setTimeout(expirar, Math.max(0, vence - Date.now()));
    return () => clearTimeout(temporizador);
  }, [sesion, expirar]);

  const valor = useMemo(() => ({ sesion, vencida, abrir, cerrar }), [sesion, vencida, abrir, cerrar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): SesionContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion debe usarse dentro de SesionProvider');
  return c;
}
