import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Rutas } from '@/app/App';
import { crearServiciosEnMemoria } from '@/services/memoria/serviciosEnMemoria';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider } from '@/services/ServiciosContext';

interface Opciones {
  ruta?: string;
  servicios?: Servicios;
}

/** Monta la aplicación completa en una ruta, con datos en memoria y sin latencia. */
export function renderizarEn({ ruta = '/', servicios = crearServiciosEnMemoria({ latenciaMs: 0 }) }: Opciones = {}) {
  const resultado = render(
    <ServiciosProvider servicios={servicios}>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </ServiciosProvider>,
  );
  return { ...resultado, servicios };
}
