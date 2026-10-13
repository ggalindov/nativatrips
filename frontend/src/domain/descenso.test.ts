import { describe, expect, it } from 'vitest';
import {
  ALTITUD_CUMBRE,
  ALTITUD_LAGUNA,
  altitudPorProgreso,
  formatearAltitud,
  indiceEtapa,
  limitarProgreso,
  opacidadNiebla,
} from './descenso';

describe('descenso por scroll', () => {
  it('va de la cumbre a la laguna a medida que avanza el progreso', () => {
    expect(altitudPorProgreso(0)).toBe(ALTITUD_CUMBRE);
    expect(altitudPorProgreso(1)).toBe(ALTITUD_LAGUNA);
    expect(altitudPorProgreso(0.5)).toBe(3575);
  });

  it('limita el progreso al rango 0–1, incluso con valores inválidos', () => {
    expect(limitarProgreso(-0.4)).toBe(0);
    expect(limitarProgreso(1.7)).toBe(1);
    expect(limitarProgreso(Number.NaN)).toBe(0);
    expect(altitudPorProgreso(2)).toBe(ALTITUD_LAGUNA);
  });

  it('reparte el recorrido en cuatro etapas y mantiene la última al final', () => {
    expect(indiceEtapa(0)).toBe(0);
    expect(indiceEtapa(0.3)).toBe(1);
    expect(indiceEtapa(0.6)).toBe(2);
    expect(indiceEtapa(0.99)).toBe(3);
    expect(indiceEtapa(1)).toBe(3);
  });

  it('muestra la niebla solo en el segundo tramo', () => {
    expect(opacidadNiebla(0)).toBe(0);
    expect(opacidadNiebla(0.35)).toBe(1);
    expect(opacidadNiebla(1)).toBe(0);
  });

  it('formatea la altitud con separador de miles colombiano', () => {
    expect(formatearAltitud(3900)).toBe('3.900');
  });
});
