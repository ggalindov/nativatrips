import { describe, expect, it } from 'vitest';
import { crearFormato } from './formato';
import { detectarIdioma } from './idiomas';

describe('idiomas', () => {
  it('elige el primer idioma soportado del navegador o, si no hay, español', () => {
    expect(detectarIdioma(['de-DE', 'fr-CA', 'en'])).toBe('fr');
    expect(detectarIdioma(['pt-BR'])).toBe('pt');
    expect(detectarIdioma(['de-DE', 'ja'])).toBe('es');
  });

  it('formatea moneda y fechas según el idioma, siempre en pesos colombianos', () => {
    expect(crearFormato('es-CO').pesos(185000)).toMatch(/185\.000/);
    expect(crearFormato('en-US').pesos(185000)).toMatch(/COP|185,000/);
    expect(crearFormato('es-CO').fecha('2026-10-16')).toBe('16/10/2026');
    expect(crearFormato('en-US').fecha('2026-10-16')).toBe('10/16/2026');
  });
});
