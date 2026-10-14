import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useIdioma } from '@/i18n/IdiomaContext';
import { Simbolo } from '@/ui/Logo';
import { CURVA } from '@/ui/movimiento';

const DURACION_MINIMA_MS = 2200;
const ESPERA_MAXIMA_MS = 8000;
const CLAVE_SESION = 'nativatrips.carga-vista';

/** Puntos del sendero en zigzag, de la base a la cima (coordenadas del SVG). */
const SENDERO: [number, number][] = [
  [40, 196], [96, 178], [70, 158], [128, 140], [106, 126], [150, 100], [136, 90], [160, 62],
];

function puntoEnSendero(t: number): [number, number] {
  const tramos = SENDERO.length - 1;
  const x = Math.min(tramos - 1e-6, Math.max(0, t * tramos));
  const i = Math.floor(x);
  const f = x - i;
  const [a, b] = [SENDERO[i], SENDERO[i + 1]];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

function Excursionista({ x, y, reducido }: { x: number; y: number; reducido: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g animate={reducido ? undefined : { y: [0, -1.6, 0] }} transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="0" cy="-17" r="3.2" fill="var(--color-arena)" />
        <rect x="-4.6" y="-13" width="5" height="7" rx="1.6" fill="var(--color-lima)" />
        <path d="M0 -13 L0.6 -4" stroke="var(--color-arena)" strokeWidth="2.4" strokeLinecap="round" />
        <motion.path
          d="M0.6 -4 L-2.4 1 M0.6 -4 L3 1"
          stroke="var(--color-arena)"
          strokeWidth="2.2"
          strokeLinecap="round"
          animate={reducido ? undefined : { rotate: [-8, 8, -8] }}
          style={{ originX: '0.6px', originY: '-4px' }}
          transition={{ duration: 0.45, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d="M1 -10 L6 -6 L7.5 1" stroke="var(--color-arena)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </motion.g>
    </g>
  );
}

/**
 * Pantalla de carga de la primera visita: una persona sube por el sendero
 * hasta la cima mientras se preparan las fuentes y la portada.
 */
export function PantallaCarga() {
  const reducido = useReducedMotion() ?? false;
  const { t } = useIdioma();
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE_SESION) !== '1';
    } catch {
      return true;
    }
  });
  const [fuentesListas, setFuentesListas] = useState(false);
  const [tiempo, setTiempo] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let vigente = true;
    void document.fonts?.ready.then(() => vigente && setFuentesListas(true));
    const inicio = performance.now();
    let cuadro = 0;
    const tic = () => {
      setTiempo(performance.now() - inicio);
      cuadro = requestAnimationFrame(tic);
    };
    cuadro = requestAnimationFrame(tic);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      vigente = false;
      cancelAnimationFrame(cuadro);
      document.documentElement.style.overflow = '';
    };
  }, [visible]);

  // Avanza con el tiempo mínimo y no termina hasta que las fuentes estén listas.
  const avanceTiempo = Math.min(1, tiempo / DURACION_MINIMA_MS);
  const avance = tiempo >= ESPERA_MAXIMA_MS ? 1 : fuentesListas ? avanceTiempo : Math.min(0.92, avanceTiempo);
  const listo = avance >= 1;

  useEffect(() => {
    if (!listo || !visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(CLAVE_SESION, '1');
      } catch {
        /* sin almacenamiento: se mostrará en la próxima visita */
      }
    }, 650);
    return () => clearTimeout(t);
  }, [listo, visible]);

  const [hx, hy] = puntoEnSendero(avance);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="carga"
          role="progressbar"
          aria-label={t.carga.aria}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(avance * 100)}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-bosque text-white"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: CURVA }}
        >
          <svg viewBox="0 0 220 220" className="w-[min(70vw,320px)]" aria-hidden="true">
            <defs>
              <linearGradient id="carga-monte" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-bosque-3)" />
                <stop offset="1" stopColor="var(--color-bosque-2)" />
              </linearGradient>
            </defs>
            <circle cx="172" cy="44" r="12" fill="var(--color-lima)" opacity="0.9" />
            <path d="M0 210 L62 120 L84 146 L160 52 L220 210 Z" fill="url(#carga-monte)" />
            <path d="M146 70 L160 52 L174 70 L166 66 L160 74 L153 66 Z" fill="var(--color-arena)" opacity="0.85" />
            <polyline points={SENDERO.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--color-salvia)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" />
            <motion.polyline
              points={SENDERO.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke="var(--color-lima)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength: avance }}
            />
            <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: listo ? 1 : 0 }} style={{ originY: '62px' }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
              <path d="M160 62 L160 34" stroke="var(--color-arena)" strokeWidth="2" />
              <path d="M160 34 L178 40 L160 46 Z" fill="var(--color-lima)" />
            </motion.g>
            <Excursionista x={hx} y={hy} reducido={reducido} />
          </svg>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Simbolo tamano={34} animado />
              <span className="font-display text-2xl tracking-tight">
                <span className="font-extrabold">Nativa</span>
                <span className="font-light text-lima">Trips</span>
              </span>
            </div>
            <span className="etiqueta text-white/60">{listo ? t.carga.cima : t.carga.subiendo}</span>
            <span className="font-cifras text-sm font-black text-lima-suave tabular-nums">{Math.round(avance * 100)}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
