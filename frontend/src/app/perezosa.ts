import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * Página que se descarga la primera vez que se visita. Las páginas usan
 * exportaciones con nombre, así que se adapta al `default` que espera `lazy`.
 */
export function perezosa<P extends ComponentType<any>>(cargar: () => Promise<P>) {
  return lazy(() => cargar().then((componente) => ({ default: componente })));
}
