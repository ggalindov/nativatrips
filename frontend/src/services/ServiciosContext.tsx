import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { crearServiciosHttp } from './http/serviciosHttp';
import type { OpcionesCliente } from './http/clienteHttp';
import { crearServiciosEnMemoria } from './memoria/serviciosEnMemoria';
import type { Servicios } from './puertos';

/** Elige el adaptador según VITE_FUENTE_DATOS; por defecto, datos en memoria. */
export function crearServicios(opciones: Pick<OpcionesCliente, 'idioma' | 'token'>): Servicios {
  if (import.meta.env.VITE_FUENTE_DATOS === 'http') {
    return crearServiciosHttp({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080', ...opciones });
  }
  return crearServiciosEnMemoria();
}

const ServiciosContext = createContext<Servicios | null>(null);

export function ServiciosProvider({ servicios, children }: { servicios: Servicios; children: ReactNode }) {
  return <ServiciosContext.Provider value={servicios}>{children}</ServiciosContext.Provider>;
}

export function useServicios(): Servicios {
  const s = useContext(ServiciosContext);
  if (!s) throw new Error('useServicios debe usarse dentro de ServiciosProvider');
  return s;
}
