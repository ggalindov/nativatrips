import { describe, expect, it } from 'vitest';
import type { ElementoBiblioteca } from './biblioteca';
import { contarPorCategoria, filtrarPorCategoria, indiceCircular, ordenarBiblioteca } from './biblioteca';

const medio = (id: string, extra: Partial<ElementoBiblioteca>): ElementoBiblioteca => ({
  id, tipo: 'foto', src: `/${id}.webp`, miniatura: `/${id}-720.webp`, ancho: 1600, alto: 1000,
  alt: id, categoria: 'Paisaje', credito: 'Autor', licencia: 'CC BY 4.0', propio: false, ...extra,
});

const medios = [
  medio('laguna', {}),
  medio('venado', { categoria: 'Fauna' }),
  medio('recorrido', { tipo: 'video', propio: true, categoria: 'Experiencias' }),
  medio('flor', { categoria: 'Flora', propio: true }),
];

describe('biblioteca', () => {
  it('filtra por categoría o devuelve todo', () => {
    expect(filtrarPorCategoria(medios, 'Fauna').map((m) => m.id)).toEqual(['venado']);
    expect(filtrarPorCategoria(medios, null)).toHaveLength(4);
  });

  it('pone primero el contenido propio y, dentro de él, los videos', () => {
    expect(ordenarBiblioteca(medios).map((m) => m.id)).toEqual(['recorrido', 'flor', 'laguna', 'venado']);
  });

  it('cuenta los medios de cada categoría', () => {
    expect(contarPorCategoria(medios)).toEqual({ Paisaje: 1, Flora: 1, Fauna: 1, Experiencias: 1 });
  });

  it('recorre el visor en círculo en ambos sentidos', () => {
    expect(indiceCircular(3, 1, 4)).toBe(0);
    expect(indiceCircular(0, -1, 4)).toBe(3);
    expect(indiceCircular(0, 1, 0)).toBe(0);
  });
});
