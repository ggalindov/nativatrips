import { describe, expect, it } from 'vitest';
import { EQUIPAJE, capasRecomendadas, progresoEquipaje, temperaturaEstimada } from './clima';

describe('clima por altitud', () => {
  it('baja 0,65 °C por cada 100 m sobre la referencia', () => {
    expect(temperaturaEstimada(2600)).toBe(14);
    expect(temperaturaEstimada(3600)).toBe(7.5);
    expect(temperaturaEstimada(3900)).toBe(5.6);
  });

  it('recomienda más capas cuanto más frío', () => {
    expect(capasRecomendadas(5)).toBe('frio');
    expect(capasRecomendadas(8)).toBe('fresco');
    expect(capasRecomendadas(12)).toBe('templado');
  });
});

describe('equipaje', () => {
  it('cuenta lo listo y los obligatorios que faltan', () => {
    expect(progresoEquipaje(new Set())).toMatchObject({ listos: 0, pct: 0, faltanObligatorios: 8 });
    const todo = progresoEquipaje(new Set(EQUIPAJE.map((e) => e.id)));
    expect(todo).toMatchObject({ listos: EQUIPAJE.length, pct: 100, faltanObligatorios: 0 });
  });
});
