import { useCallback, useEffect, useState } from 'react';
import type { Diccionario } from '@/i18n/diccionarios/es';
import { useIdioma } from '@/i18n/IdiomaContext';
import { ErrorServicio } from './puertos';

export type EstadoConsulta<T> =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; datos: T };

type EstadoInterno<T> = { tipo: 'cargando' } | { tipo: 'error'; error: unknown } | { tipo: 'listo'; datos: T };

/** Mensaje de un error en el idioma activo: por su código si lo tiene, si no el del servidor. */
export function mensajeDeError(e: unknown, t: Diccionario): string {
  if (e instanceof ErrorServicio) return e.codigo ? t.errores[e.codigo] : e.message;
  return t.errores.generico;
}

/** `mensajeDeError` con el diccionario del idioma activo. */
export function useMensajeError(): (e: unknown) => string {
  const { t } = useIdioma();
  return useCallback((e: unknown) => mensajeDeError(e, t), [t]);
}

/**
 * Ejecuta una consulta asíncrona y expone su estado. `recargar` la repite;
 * `deps` decide cuándo volver a consultar. El mensaje de error se traduce al
 * mostrarlo, así que sigue al idioma si la persona lo cambia.
 */
export function useConsulta<T>(consulta: () => Promise<T>, deps: readonly unknown[]) {
  const [interno, setInterno] = useState<EstadoInterno<T>>({ tipo: 'cargando' });
  const [version, setVersion] = useState(0);
  const mensaje = useMensajeError();

  useEffect(() => {
    let vigente = true;
    setInterno({ tipo: 'cargando' });
    consulta()
      .then((datos) => vigente && setInterno({ tipo: 'listo', datos }))
      .catch((error: unknown) => vigente && setInterno({ tipo: 'error', error }));
    return () => {
      vigente = false;
    };
    // `deps` las fija quien llama (como en useMemo); la regla las revisa en cada llamada a useConsulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const setEstado = useCallback((e: { tipo: 'listo'; datos: T } | { tipo: 'error'; error: unknown }) => setInterno(e), []);
  const estado: EstadoConsulta<T> = interno.tipo === 'error' ? { tipo: 'error', mensaje: mensaje(interno.error) } : interno;
  return { estado, recargar, setEstado };
}
