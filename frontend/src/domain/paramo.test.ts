import { describe, expect, it } from 'vitest';
import { DATOS_PARAMO, formatearAltitud, siguienteDato } from './paramo';

describe('datos del páramo', () => {
  it('rota en círculo en ambos sentidos', () => {
    expect(siguienteDato(0)).toBe(1);
    expect(siguienteDato(DATOS_PARAMO.length - 1)).toBe(0);
    expect(siguienteDato(0, -1)).toBe(DATOS_PARAMO.length - 1);
  });

  it('cada dato trae su cifra y su detalle', () => {
    for (const d of DATOS_PARAMO) {
      expect(d.cifra.length).toBeGreaterThan(0);
      expect(d.detalle.length).toBeGreaterThan(0);
    }
  });

  it('formatea la altitud con separador de miles', () => {
    expect(formatearAltitud(3900)).toBe('3.900');
  });
});
