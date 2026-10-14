import { describe, expect, it } from 'vitest';
import { TOTAL_DATOS_PARAMO, siguienteDato } from './paramo';

describe('datos del páramo', () => {
  it('rota en círculo en ambos sentidos', () => {
    expect(siguienteDato(0)).toBe(1);
    expect(siguienteDato(TOTAL_DATOS_PARAMO - 1)).toBe(0);
    expect(siguienteDato(0, -1)).toBe(TOTAL_DATOS_PARAMO - 1);
  });
});
