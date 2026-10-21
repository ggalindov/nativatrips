import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { renderizarEn, SESION_ADMIN } from '@/test/renderizar';

/**
 * Revisión automática con axe de las pantallas principales. jsdom no calcula estilos, así que el
 * contraste de color lo cubre Lighthouse en la CI con un navegador real.
 */
async function violacionesGraves(contenedor: Element) {
  const resultado = await axe.run(contenedor, {
    rules: { 'color-contrast': { enabled: false } },
    // El mapa embebido es de un tercero; axe no puede entrar a iframes en jsdom.
    iframes: false,
    resultTypes: ['violations'],
  });
  return resultado.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

/** axe recorre todo el DOM: la portada pasa de 15 s cuando la suite corre en paralelo. */
const AXE_TIEMPO_MS = 30_000;

const PANTALLAS = [
  { ruta: '/', nombre: 'portada' },
  { ruta: '/senderos', nombre: 'catálogo' },
  { ruta: '/reservar', nombre: 'reserva' },
  { ruta: '/mi-reserva', nombre: 'solicitar enlace' },
  { ruta: '/antes-de-subir', nombre: 'antes de subir' },
  { ruta: '/equipo/acceso', nombre: 'acceso del equipo' },
];

describe('accesibilidad', () => {
  it.each(PANTALLAS)('$nombre ($ruta) no tiene violaciones graves', async ({ ruta }) => {
    const { container } = renderizarEn({ ruta });
    await screen.findAllByRole('heading', { level: 1 });
    expect(await violacionesGraves(container)).toEqual([]);
  }, AXE_TIEMPO_MS);

  it('el panel del administrador no tiene violaciones graves', async () => {
    const { container } = renderizarEn({ ruta: '/equipo/admin', sesion: SESION_ADMIN });
    await screen.findAllByRole('heading', { level: 1 });
    expect(await violacionesGraves(container)).toEqual([]);
  }, AXE_TIEMPO_MS);
});
