import { describe, expect, it } from 'vitest';
import { cuadroCercano, ordenDeCarga } from './secuencia';

describe('secuencia de cuadros', () => {
  it('carga primero una muestra espaciada y luego completa todos sin repetir', () => {
    const orden = ordenDeCarga(40);
    expect(orden.slice(0, 4)).toEqual([0, 39, 16, 32]);
    expect(new Set(orden).size).toBe(40);
    expect(orden).toHaveLength(40);
  });

  it('elige el cuadro cargado más cercano al pedido', () => {
    const cargados: boolean[] = [];
    cargados[0] = true;
    cargados[16] = true;
    expect(cuadroCercano(16, cargados, 40)).toBe(16);
    expect(cuadroCercano(10, cargados, 40)).toBe(16);
    expect(cuadroCercano(5, cargados, 40)).toBe(0);
    expect(cuadroCercano(5, [], 40)).toBe(-1);
  });
});
