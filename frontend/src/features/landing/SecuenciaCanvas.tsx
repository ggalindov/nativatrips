import { useEffect, useRef } from 'react';
import type { MotionValue } from 'motion/react';
import { cargadorSecuencia, cuadroCercano } from '@/contenido/secuencia';

/** Dibuja la imagen cubriendo el lienzo, como `object-fit: cover`. */
function dibujarCubriendo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, ancho: number, alto: number) {
  const escala = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
  const w = img.naturalWidth * escala;
  const h = img.naturalHeight * escala;
  ctx.drawImage(img, (ancho - w) / 2, (alto - h) / 2, w, h);
}

/**
 * Pinta en un canvas el cuadro del video que corresponde al progreso del
 * scroll (0 a 1). Usa el cuadro cargado más cercano mientras llegan los demás.
 */
export function SecuenciaCanvas({ progreso, etiqueta }: { progreso: MotionValue<number>; etiqueta: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const cargador = cargadorSecuencia();
    cargador.iniciar().catch(() => undefined);

    let ultimo = -1;
    let cuadro = 0;
    let pendiente = true;

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ultimo = -1;
      pendiente = true;
    };

    const pintar = () => {
      cuadro = requestAnimationFrame(pintar);
      const total = cargador.manifiesto?.total ?? 0;
      if (!total) return;
      const pedido = Math.min(total - 1, Math.max(0, Math.round(progreso.get() * (total - 1))));
      const disponible = cuadroCercano(pedido, cargador.imagenes, total);
      if (disponible === -1 || (disponible === ultimo && !pendiente)) return;
      const img = cargador.imagenes[disponible];
      if (!img) return;
      dibujarCubriendo(ctx, img, canvas.width, canvas.height);
      ultimo = disponible;
      pendiente = disponible !== pedido;
    };

    ajustar();
    window.addEventListener('resize', ajustar);
    const dejar = cargador.escuchar(() => {
      pendiente = true;
    });
    cuadro = requestAnimationFrame(pintar);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('resize', ajustar);
      dejar();
    };
  }, [progreso]);

  return <canvas ref={ref} role="img" aria-label={etiqueta} className="absolute inset-0 h-full w-full" />;
}
