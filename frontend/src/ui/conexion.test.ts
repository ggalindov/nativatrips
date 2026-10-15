import { afterEach, describe, expect, it } from 'vitest';
import { conexionLimitada } from './conexion';

function simularRed(red: object | undefined) {
  Object.defineProperty(navigator, 'connection', { value: red, configurable: true });
}

describe('conexión limitada', () => {
  afterEach(() => simularRed(undefined));

  it('detecta el ahorro de datos y las conexiones 2G', () => {
    simularRed({ saveData: true, effectiveType: '4g' });
    expect(conexionLimitada()).toBe(true);
    simularRed({ saveData: false, effectiveType: 'slow-2g' });
    expect(conexionLimitada()).toBe(true);
  });

  it('no limita si la red es buena o el navegador no informa', () => {
    simularRed({ saveData: false, effectiveType: '4g' });
    expect(conexionLimitada()).toBe(false);
    simularRed(undefined);
    expect(conexionLimitada()).toBe(false);
  });
});
