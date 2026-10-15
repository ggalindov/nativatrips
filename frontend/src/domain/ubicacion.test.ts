import { describe, expect, it } from 'vitest';
import { RESERVA, enlaceGoogleMaps, enlaceWaze, mapaEmbebido } from './ubicacion';

describe('ubicación de la reserva', () => {
  it('Waze y Google Maps llevan a las mismas coordenadas', () => {
    const destino = `${RESERVA.latitud},${RESERVA.longitud}`;
    expect(enlaceWaze()).toBe(`https://waze.com/ul?ll=${destino}&navigate=yes`);
    expect(enlaceGoogleMaps()).toContain(`destination=${destino}`);
  });

  it('el mapa sale en el idioma del sitio', () => {
    expect(mapaEmbebido('fr')).toContain('hl=fr');
    expect(mapaEmbebido('es')).toContain('output=embed');
  });
});
