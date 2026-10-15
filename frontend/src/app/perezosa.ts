import { lazy } from 'react';
import type { ComponentType } from 'react';
import { registrarCarga } from './carga';

/**
 * Página que se descarga la primera vez que se visita. Las páginas usan
 * exportaciones con nombre, así que se adapta al `default` que espera `lazy`.
 * Si se pide durante la primera carga, la pantalla de carga la espera, salvo
 * que sea un complemento que no hace falta para ver la página.
 */
export function perezosa<P extends ComponentType<any>>(cargar: () => Promise<P>, { complemento = false } = {}) {
  return lazy(() => {
    const descarga = cargar();
    if (!complemento) registrarCarga(descarga);
    return descarga.then((componente) => ({ default: componente }));
  });
}
