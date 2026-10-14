import { describe, expect, it } from 'vitest';
import { Sendero, aleatorio } from './geometria';

const sendero = new Sendero([
  [0, 100],
  [100, 100],
  [100, 0],
]);

describe('geometría del sendero', () => {
  it('empieza y termina en los puntos de control extremos', () => {
    expect(sendero.en(0)).toMatchObject({ x: 0, y: 100 });
    const fin = sendero.en(1);
    expect(fin.x).toBeCloseTo(100);
    expect(fin.y).toBeCloseTo(0);
  });

  it('avanza de forma monótona en distancia recorrida', () => {
    let anterior = -1;
    for (let f = 0; f <= 1; f += 0.1) {
      const p = sendero.en(f);
      const recorrido = p.x + (100 - p.y);
      expect(recorrido).toBeGreaterThan(anterior);
      anterior = recorrido;
    }
  });

  it('indica el sentido de la marcha', () => {
    expect(sendero.en(0.1).sentido).toBe(1);
  });

  it('el paisaje pseudoaleatorio se repite con la misma semilla', () => {
    const a = aleatorio(7);
    const b = aleatorio(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
