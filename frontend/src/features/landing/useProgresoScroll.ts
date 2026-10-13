import { useEffect, useRef, useState } from 'react';

function prefiereMenosMovimiento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Progreso (0 a 1) del scroll a lo largo de una sección más alta que la
 * ventana. `reducido` indica que la persona pidió menos movimiento: el
 * progreso se sigue midiendo, pero la escena no debe desplazar capas.
 */
export function useProgresoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progreso, setProgreso] = useState(0);
  const [reducido] = useState(prefiereMenosMovimiento);

  useEffect(() => {
    let cuadro = 0;

    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const recorrido = r.height - window.innerHeight;
        const p = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
        setProgreso((anterior) => (Math.abs(anterior - p) > 0.001 ? p : anterior));
      });
    };

    medir();
    window.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, []);

  return { ref, progreso, reducido };
}
