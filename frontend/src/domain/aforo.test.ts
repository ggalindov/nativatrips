import { describe, expect, it } from 'vitest';
import { ajustarPersonas, cuposLibres, nivelAforo, porcentajeOcupacion } from './aforo';

const fecha = '2026-10-16';

describe('aforo', () => {
  it('calcula cupos libres sin bajar de cero', () => {
    expect(cuposLibres({ fecha, limite: 20, ocupados: 14 })).toBe(6);
    expect(cuposLibres({ fecha, limite: 20, ocupados: 25 })).toBe(0);
  });

  it('marca alerta desde el 80 % y lleno cuando no quedan cupos', () => {
    expect(nivelAforo({ fecha, limite: 20, ocupados: 15 })).toBe('disponible');
    expect(nivelAforo({ fecha, limite: 20, ocupados: 16 })).toBe('alerta');
    expect(nivelAforo({ fecha, limite: 20, ocupados: 20 })).toBe('lleno');
  });

  it('reporta 100 % cuando el límite no es válido', () => {
    expect(porcentajeOcupacion({ fecha, limite: 0, ocupados: 0 })).toBe(100);
    expect(porcentajeOcupacion({ fecha, limite: 40, ocupados: 34 })).toBe(85);
  });

  it('nunca deja reservar más personas que los cupos libres', () => {
    const d = { fecha, limite: 20, ocupados: 17 };
    expect(ajustarPersonas(5, d)).toBe(3);
    expect(ajustarPersonas(0, d)).toBe(1);
    expect(ajustarPersonas(2, { fecha, limite: 20, ocupados: 20 })).toBe(0);
  });
});
