import { beforeEach, describe, expect, it } from 'vitest';
import {
  AVISO_LENTO_MS,
  DURACION_MINIMA_MS,
  avisoDeCarga,
  cerrarCarga,
  estadoCarga,
  registrarCarga,
  reiniciarCarga,
  siguienteAvance,
  techoDeAvance,
} from './carga';

describe('registro de la primera carga', () => {
  beforeEach(reiniciarCarga);

  it('cuenta las tareas terminadas, incluidas las que fallan', async () => {
    let resolver = () => {};
    registrarCarga(new Promise<void>((r) => (resolver = r)));
    registrarCarga(Promise.reject(new Error('sin red')));
    await Promise.resolve();
    await Promise.resolve();
    expect(estadoCarga()).toEqual({ total: 2, hechas: 1, completa: false });
    resolver();
    await Promise.resolve();
    expect(estadoCarga().completa).toBe(true);
  });

  it('ignora lo que se descarga después de la primera carga', () => {
    cerrarCarga();
    registrarCarga(new Promise(() => {}));
    expect(estadoCarga()).toEqual({ total: 0, hechas: 0, completa: true });
  });
});

describe('avance del excursionista', () => {
  it('no llega a la cima mientras falte algo, por mucho que se demore', () => {
    expect(techoDeAvance(0.5, false, 120_000)).toBeLessThan(1);
    expect(techoDeAvance(0.5, false, 0)).toBe(0.5);
    expect(techoDeAvance(0.5, true, 0)).toBe(1);
  });

  it('sigue subiendo despacio mientras espera', () => {
    expect(techoDeAvance(0.25, false, 4000)).toBeGreaterThan(techoDeAvance(0.25, false, 1000));
  });

  it('respeta la duración mínima aunque todo haya cargado', () => {
    expect(siguienteAvance(0, 1, DURACION_MINIMA_MS / 2)).toBeLessThan(0.5);
    let avance = 0;
    for (let cuadro = 0; cuadro < 200; cuadro += 1) avance = siguienteAvance(avance, 1, DURACION_MINIMA_MS);
    expect(avance).toBe(1);
  });

  it('nunca retrocede', () => {
    expect(siguienteAvance(0.7, 0.5, 5000)).toBe(0.7);
  });
});

describe('avisos de conexión', () => {
  it('avisa de conexión lenta solo después de esperar', () => {
    expect(avisoDeCarga(AVISO_LENTO_MS - 1, false, true)).toBe('ninguno');
    expect(avisoDeCarga(AVISO_LENTO_MS, false, true)).toBe('lento');
    expect(avisoDeCarga(AVISO_LENTO_MS, true, true)).toBe('ninguno');
  });

  it('dice que no hay internet en cuanto se pierde la conexión', () => {
    expect(avisoDeCarga(100, false, false)).toBe('sin-conexion');
  });
});
