import { describe, expect, it } from 'vitest';
import { ALTITUD_CUMBRE, ALTITUD_INICIO, HITOS, altitudPorProgreso, formatearAltitud, indiceHito, limitarProgreso, progresoDeHito } from './ascenso';

describe('ascenso por scroll', () => {
  it('sube del bosque a la cumbre con el progreso', () => {
    expect(altitudPorProgreso(0)).toBe(ALTITUD_INICIO);
    expect(altitudPorProgreso(1)).toBe(ALTITUD_CUMBRE);
    expect(altitudPorProgreso(0.5)).toBe(3450);
  });

  it('acota el progreso, incluso con valores inválidos', () => {
    expect(limitarProgreso(-1)).toBe(0);
    expect(limitarProgreso(3)).toBe(1);
    expect(limitarProgreso(Number.NaN)).toBe(0);
  });

  it('ubica cada hito en su altitud y elige el más cercano', () => {
    expect(progresoDeHito(0)).toBe(0);
    expect(progresoDeHito(HITOS.length - 1)).toBe(1);
    expect(indiceHito(0)).toBe(0);
    expect(indiceHito(progresoDeHito(2) + 0.05)).toBe(2);
    expect(indiceHito(1)).toBe(HITOS.length - 1);
  });

  it('los hitos van en orden de altitud', () => {
    const altitudes = HITOS.map((h) => h.altitud);
    expect([...altitudes].sort((a, b) => a - b)).toEqual(altitudes);
  });

  it('formatea la altitud con separador de miles', () => {
    expect(formatearAltitud(3900)).toBe('3.900');
  });
});
