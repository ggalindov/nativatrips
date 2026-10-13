import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Rutas } from '@/app/App';
import type { SesionEquipo } from '@/domain/equipo';
import { SesionProvider } from '@/features/equipo/SesionContext';
import { crearServiciosEnMemoria } from '@/services/memoria/serviciosEnMemoria';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider } from '@/services/ServiciosContext';

interface Opciones {
  ruta?: string;
  sesion?: SesionEquipo | null;
  servicios?: Servicios;
}

/** Monta la aplicación completa en una ruta, con datos en memoria y sin latencia. */
export function renderizarEn({ ruta = '/', sesion = null, servicios = crearServiciosEnMemoria({ latenciaMs: 0 }) }: Opciones = {}) {
  const resultado = render(
    <ServiciosProvider servicios={servicios}>
      <SesionProvider inicial={sesion}>
        <MemoryRouter initialEntries={[ruta]}>
          <Rutas />
        </MemoryRouter>
      </SesionProvider>
    </ServiciosProvider>,
  );
  return { ...resultado, servicios };
}

export const SESION_GUIA: SesionEquipo = { nombre: 'Marta León', correo: 'guia@ecopalacio.co', rol: 'GUIA_TURISTICO', token: 't' };
export const SESION_ADMIN: SesionEquipo = { nombre: 'Andrea Ruiz', correo: 'admin@ecopalacio.co', rol: 'PERSONAL_ADMINISTRATIVO', token: 't' };
