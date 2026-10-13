import { describe, expect, it } from 'vitest';
import { diaSemana, formatearFecha, formatearFechaCorta, hoyIso, sumarDias } from './fechas';

describe('fechas', () => {
  it('usa la fecha local, no la de UTC', () => {
    expect(hoyIso(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12');
  });

  it('suma días cruzando el fin de mes', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
  });

  it('formatea fechas para la interfaz', () => {
    expect(diaSemana('2026-10-16')).toBe('vie');
    expect(formatearFecha('2026-10-16')).toBe('16/10/2026');
    expect(formatearFechaCorta('2026-10-16')).toBe('vie 16/10');
  });
});
