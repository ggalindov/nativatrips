import { useId } from 'react';
import type { CSSProperties } from 'react';

/**
 * Fauna del páramo de Chingaza en estilo plano. Cada animal se dibuja con
 * los pies en y = 0 de su propio sistema de coordenadas y se ubica sobre el
 * terreno con `x`, `y` y `s`. Los movimientos en bucle están en paramo.css.
 */
interface Ubicado {
  x: number;
  y: number;
  s?: number;
}

/** Pata que oscila desde la cadera mientras el animal camina. */
function Pata({ d, x, y, fase, color, periodo = 0.8 }: { d: string; x: number; y: number; fase: number; color: string; periodo?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={d} fill={color} className="bucle bucle-pata" style={{ '--fase': fase, animationDuration: `${periodo}s` } as CSSProperties} />
    </g>
  );
}

const PATA_DELANTERA = 'M-3.2 0 L3.2 0 L2.4 20 L2.8 34 L3.4 38 L-2.2 38 L-1.6 34 L-2.4 20 Z';
const PATA_TRASERA = 'M-5.5 0 L5.5 0 L4.4 14 L1 24 L2.8 38 L-2.2 38 L-3.4 24 L-3.6 14 Z';

/** Venado de cola blanca: camina por la loma, se detiene a pastar y regresa. */
export function Venado({ x, y, s = 1 }: Ubicado) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bucle bucle-venado">
        <ellipse cx="0" cy="1" rx="44" ry="4" fill="#1b2a1d" opacity="0.18" />
        <Pata d={PATA_TRASERA} x={-30} y={-40} fase={1} color="#7f5c3d" />
        <Pata d={PATA_DELANTERA} x={20} y={-38} fase={-1} color="#7f5c3d" />
        {/* cuerpo */}
        <path
          d="M-40 -48 C -42 -62 -20 -66 0 -64 C 18 -63 30 -62 36 -56 C 42 -50 40 -38 32 -34 C 16 -30 -16 -30 -32 -34 C -40 -37 -42 -42 -40 -48 Z"
          fill="#a67b52"
        />
        <path d="M-28 -36 C -10 -32 12 -32 30 -36 C 20 -31 -14 -30 -28 -36 Z" fill="#e6d6b8" />
        <path d="M-40 -50 C -50 -56 -52 -64 -47 -66 C -42 -61 -40 -57 -37 -53 Z" fill="#f6f1e6" />
        <Pata d={PATA_TRASERA} x={-22} y={-40} fase={-1} color="#93693f" />
        <Pata d={PATA_DELANTERA} x={28} y={-38} fase={1} color="#93693f" />
        {/* cuello y cabeza: se agacha a pastar */}
        <g className="bucle bucle-venado-cabeza">
          <path d="M24 -58 C 30 -70 34 -80 38 -88 L 50 -84 C 47 -72 44 -60 38 -48 Z" fill="#a67b52" />
          <path d="M40 -78 C 42 -70 42 -62 40 -56 L 46 -58 C 47 -66 47 -72 46 -80 Z" fill="#efe5d2" />
          <path d="M37 -92 C 43 -99 54 -97 60 -91 L 70 -85 C 73 -81 69 -78 64 -79 L 52 -80 C 44 -80 37 -84 37 -92 Z" fill="#a67b52" />
          <path d="M41 -93 L 30 -102 L 44 -98 Z" fill="#8b6340" />
          <path
            d="M47 -96 C 45 -106 49 -113 58 -117 M48 -104 L 41 -111 M52 -111 L 55 -120"
            stroke="#6b4c31"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="52" cy="-90" r="1.9" fill="#1b1f1c" />
          <circle cx="69.5" cy="-83" r="2.3" fill="#1b1f1c" />
        </g>
      </g>
    </g>
  );
}

const PATA_OSO = 'M-7 0 L7 0 L7 20 C 7 24 -7 24 -7 20 Z';

/** Oso andino (de anteojos): sale de los arbustos, mira alrededor y vuelve. */
export function OsoAndino({ x, y, s = 1 }: Ubicado) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bucle bucle-oso">
        <ellipse cx="6" cy="1" rx="56" ry="5" fill="#1b2a1d" opacity="0.2" />
        <Pata d={PATA_OSO} x={42} y={-22} fase={1} color="#121411" periodo={1.1} />
        <Pata d={PATA_OSO} x={-20} y={-22} fase={-1} color="#121411" periodo={1.1} />
        <path d="M-38 -38 C -38 -64 -8 -76 20 -72 C 46 -68 60 -54 60 -34 C 60 -22 52 -16 44 -14 L -28 -14 C -36 -18 -40 -28 -38 -38 Z" fill="#1d1f1b" />
        <path d="M-32 -30 C -28 -22 -22 -18 -16 -22 C -18 -28 -22 -32 -28 -34 Z" fill="#d9c79a" />
        <Pata d={PATA_OSO} x={52} y={-22} fase={-1} color="#1d1f1b" periodo={1.1} />
        <Pata d={PATA_OSO} x={-8} y={-22} fase={1} color="#1d1f1b" periodo={1.1} />
        {/* cabeza que mira alrededor */}
        <g className="bucle bucle-oso-cabeza">
          <circle cx="-50" cy="-70" r="7" fill="#1d1f1b" />
          <circle cx="-30" cy="-70" r="7" fill="#1d1f1b" />
          <circle cx="-50" cy="-70" r="3" fill="#3b3a33" />
          <circle cx="-30" cy="-70" r="3" fill="#3b3a33" />
          <ellipse cx="-42" cy="-52" rx="20" ry="18" fill="#1d1f1b" />
          {/* "anteojos" color crema característicos */}
          <path d="M-56 -60 C -55 -66 -47 -66 -44 -58 C -43 -52 -48 -48 -53 -50 C -57 -52 -57 -56 -56 -60 Z" fill="#e7d7ad" />
          <path d="M-38 -62 C -35 -64 -31 -62 -31 -57 C -32 -54 -35 -54 -37 -56 Z" fill="#e7d7ad" opacity="0.85" />
          <ellipse cx="-58" cy="-44" rx="11" ry="8" fill="#e2cf9f" />
          <ellipse cx="-66" cy="-47" rx="4" ry="3" fill="#121411" />
          <circle cx="-49.5" cy="-56.5" r="2.2" fill="#121411" />
          <circle cx="-34.5" cy="-58" r="1.8" fill="#121411" />
        </g>
      </g>
    </g>
  );
}

/** Cóndor andino: planea en grandes arcos, inclinándose en las vueltas. */
export function Condor({ x, y, s = 1, ancho = 820, alto = 50 }: Ubicado & { ancho?: number; alto?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bucle bucle-condor" style={{ '--ancho': ancho, '--alto': alto } as CSSProperties}>
        <g className="bucle bucle-alas">
          <path d="M-4 0 C -22 -8 -44 -12 -64 -10 L -76 -6 L -68 -4 L -78 0 L -68 1 L -76 5 L -62 5 C -42 5 -22 6 -4 7 Z" fill="#1a1c1a" />
          <path d="M4 0 C 22 -8 44 -12 64 -10 L 76 -6 L 68 -4 L 78 0 L 68 1 L 76 5 L 62 5 C 42 5 22 6 4 7 Z" fill="#1a1c1a" />
          <path d="M-10 -1 C -24 -6 -40 -8 -54 -7 L -52 -3 C -38 -2 -24 0 -10 3 Z" fill="#e9e6dc" />
          <path d="M10 -1 C 24 -6 40 -8 54 -7 L 52 -3 C 38 -2 24 0 10 3 Z" fill="#e9e6dc" />
        </g>
        <path d="M-6 4 L -18 2 L -18 9 Z" fill="#1a1c1a" />
        <ellipse cx="0" cy="4" rx="13" ry="5" fill="#1a1c1a" />
        <ellipse cx="9" cy="2.5" rx="4.5" ry="4" fill="#f4f1ea" />
        <circle cx="14" cy="1.5" r="3.4" fill="#9a7b72" />
        <path d="M17 1 L 20 2.5 L 17 3.5 Z" fill="#d9c9a6" />
      </g>
    </g>
  );
}

/**
 * Colibrí: va de flor en flor entre los frailejones del primer plano. El
 * recorrido depende de los puntos, así que su animación se genera aquí; se
 * detiene un momento en cada flor.
 */
export function Colibri({ puntos }: { puntos: readonly (readonly [number, number])[] }) {
  const nombre = `colibri-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const paradas = puntos.flatMap((p) => [p, p]);
  const pasos = paradas.map(([x, y], i) => `${((i / paradas.length) * 100).toFixed(2)}% { transform: translate(${x}px, ${y}px); }`);
  pasos.push(`100% { transform: translate(${puntos[0][0]}px, ${puntos[0][1]}px); }`);
  return (
    <g className="bucle" style={{ animation: `${nombre} ${puntos.length * 4}s ease-in-out infinite` }}>
      <style>{`@keyframes ${nombre} { ${pasos.join(' ')} }`}</style>
      <g className="bucle bucle-colibri-vuelo">
        <g transform="scale(1.5)">
          <path d="M9 -1 L 24 -3" stroke="#1b1f1c" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M-8 1 L -20 -2 L -19 4 Z" fill="#1e5a41" />
          <ellipse cx="0" cy="0" rx="10" ry="5.5" fill="#2f8a62" />
          <circle cx="7" cy="-2" r="4.6" fill="#2f8a62" />
          <path d="M3 2 C 6 5 9 4 10 1" stroke="#d9433b" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="8.5" cy="-3" r="1.1" fill="#111" />
          <ellipse cx="-1" cy="-8" rx="4.5" ry="10" fill="#bfe7d6" opacity="0.75" className="bucle bucle-colibri-ala" />
        </g>
      </g>
    </g>
  );
}

/** Pato de páramo: nada despacio de un lado a otro de la laguna. */
export function PatoParamo({ x, y, s = 1 }: Ubicado) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bucle bucle-pato">
        <path d="M-30 4 Q -20 1 -10 4 M10 4 Q 20 1 30 4" stroke="#cfe2e6" strokeWidth="1.6" strokeLinecap="round" fill="none" className="bucle bucle-pato-estela" />
        <g className="bucle bucle-pato-flota">
          <path d="M-18 0 C -18 -9 -4 -11 8 -8 L 12 -6 C 14 -2 12 2 8 3 L -14 3 C -17 3 -18 2 -18 0 Z" fill="#7a5c3c" />
          <path d="M-12 -4 C -4 -9 4 -9 8 -5" stroke="#a7865e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M-18 -1 L -22 -5 L -17 -4 Z" fill="#5f462e" />
          <circle cx="12" cy="-12" r="6" fill="#5f462e" />
          <path d="M17 -12 L 25 -10 L 17 -8.5 Z" fill="#e0c24a" />
          <circle cx="13.5" cy="-13" r="1.2" fill="#111" />
        </g>
      </g>
    </g>
  );
}

/** Rana de páramo: salta de un lado a otro de su roca. */
export function Rana({ x, y, s = 1 }: Ubicado) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-30 0 C -28 -14 -14 -22 4 -22 C 20 -22 32 -12 34 0 Z" fill="#8a8c82" />
      <path d="M-18 -14 C -8 -20 8 -20 18 -14" stroke="#a4a69b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g className="bucle bucle-rana">
        <g transform="translate(0 -21)">
          <path d="M-11 0 C -14 -2 -16 2 -18 3 M11 0 C 14 -2 16 2 18 3" stroke="#4f7a2f" strokeWidth="3" strokeLinecap="round" fill="none" />
          <ellipse cx="0" cy="-6" rx="11" ry="7.5" fill="#62913b" />
          <ellipse cx="0" cy="-3" rx="7" ry="3.5" fill="#c9d98a" />
          <circle cx="-5.5" cy="-13" r="3.6" fill="#62913b" />
          <circle cx="5.5" cy="-13" r="3.6" fill="#62913b" />
          <circle cx="-5.5" cy="-13.5" r="1.6" fill="#111" />
          <circle cx="5.5" cy="-13.5" r="1.6" fill="#111" />
        </g>
      </g>
    </g>
  );
}
