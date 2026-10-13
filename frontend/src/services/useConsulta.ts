import { useCallback, useEffect, useState } from 'react';
import { ErrorServicio } from './puertos';

export type EstadoConsulta<T> =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; datos: T };

export function mensajeDeError(e: unknown): string {
  return e instanceof ErrorServicio ? e.message : 'Algo salió mal. Intenta de nuevo.';
}

/**
 * Ejecuta una consulta asíncrona y expone su estado. `recargar` la repite;
 * `deps` decide cuándo volver a consultar.
 */
export function useConsulta<T>(consulta: () => Promise<T>, deps: readonly unknown[]) {
  const [estado, setEstado] = useState<EstadoConsulta<T>>({ tipo: 'cargando' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ tipo: 'cargando' });
    consulta()
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch((e: unknown) => vigente && setEstado({ tipo: 'error', mensaje: mensajeDeError(e) }));
    return () => {
      vigente = false;
    };
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { estado, recargar, setEstado };
}
