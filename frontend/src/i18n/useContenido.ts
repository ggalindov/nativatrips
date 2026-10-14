import { useMemo } from 'react';
import type { IdFoto } from '@/contenido/fotos';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import type { Dificultad, Sendero } from '@/domain/sendero';
import { useIdioma } from './IdiomaContext';

/**
 * Contenido en el idioma activo: senderos y textos alternativos traducidos,
 * y las unidades de los senderos con el formato numérico de cada idioma.
 */
export function useContenido() {
  const { t, f } = useIdioma();
  return useMemo(
    () => ({
      sendero: (s: Sendero): Sendero => {
        const tr = t.senderos[s.id];
        return tr ? { ...s, sector: tr.sector ?? s.sector, descripcion: tr.descripcion, destacados: tr.destacados } : s;
      },
      alt: (foto: { id: IdFoto; alt: string }): string => t.fotos[foto.id] ?? foto.alt,
      /** Texto alternativo de un elemento de la biblioteca; las fotos con licencia se traducen por su id. */
      altMedio: (m: ElementoBiblioteca): string => {
        const id = m.id.startsWith('commons-') ? (m.id.slice('commons-'.length) as IdFoto) : null;
        return (id && t.fotos[id]) || m.alt;
      },
      dificultad: (d: Dificultad): string => t.dificultad[d],
      duracion: (horas: number): string => `${f.decimal(horas)} h`,
      distancia: (km: number | null): string => (km === null ? '—' : `${f.decimal(km)} km`),
      metros: (m: number | null): string => (m === null ? '—' : `${f.entero(m)} m`),
      pesos: (valor: number | null): string => (valor === null ? t.comun.porConfirmar : f.pesos(valor)),
    }),
    [t, f],
  );
}
