import { memo } from 'react';
import { HITOS, formatearAltitud, progresoDeHito } from '@/domain/ascenso';
import { Sendero, aleatorio } from './geometria';
import type { Punto } from './geometria';

/** Tamaño del mundo de la ilustración, en unidades de SVG. */
export const MUNDO = { ancho: 2400, alto: 3600 } as const;

/** Sendero en zigzag desde el bosque (abajo) hasta la cumbre. */
const CONTROL: Punto[] = [
  [700, 3480], [1350, 3330], [980, 3120], [1560, 2920], [1080, 2700], [1620, 2480], [1120, 2260], [1560, 2050],
  [1080, 1860], [1500, 1640], [1140, 1420], [1450, 1200], [1180, 980], [1340, 780], [1260, 620], [1250, 545],
];

export const SENDERO = new Sendero(CONTROL);

/**
 * Macizo del páramo: lomas anchas y redondeadas con una cumbre en meseta, como
 * los cerros de Chingaza, y faldas que se extienden fuera del encuadre.
 */
const MONTANA =
  'M-3000 3600 L-3000 3150 C -2000 2950 -800 2500 -80 2300 C 150 2150 300 1900 480 1700 ' +
  'C 620 1540 700 1350 820 1180 C 920 1030 1000 820 1100 680 C 1160 600 1210 560 1280 555 ' +
  'C 1360 552 1420 600 1480 690 C 1580 840 1640 1000 1760 1160 C 1880 1320 1980 1500 2120 1680 ' +
  'C 2260 1860 2380 2050 2480 2200 C 3200 2500 4400 2950 5400 3150 L5400 3600 Z';

const BORDE_IZQUIERDO: Punto[] = [[1280, 555], [1100, 680], [820, 1180], [480, 1700], [-80, 2300]];
const BORDE_DERECHO: Punto[] = [[1280, 555], [1480, 690], [1760, 1160], [2120, 1680], [2480, 2200]];

function xEnBorde(borde: Punto[], y: number): number {
  if (y <= borde[0][1]) return borde[0][0];
  for (let i = 1; i < borde.length; i++) {
    const [ax, ay] = borde[i - 1];
    const [bx, by] = borde[i];
    if (y <= by) return ax + ((bx - ax) * (y - ay)) / (by - ay);
  }
  return borde[borde.length - 1][0];
}

/** Bordes de la montaña a cada altura, para ubicar vegetación sobre la ladera. */
function bordes(y: number): [number, number] {
  return [xEnBorde(BORDE_IZQUIERDO, y), xEnBorde(BORDE_DERECHO, y)];
}

function cercaDelSendero(x: number, y: number, margen: number): boolean {
  for (let f = 0; f <= 1; f += 0.01) {
    const p = SENDERO.en(f);
    if (Math.hypot(p.x - x, p.y - y) < margen) return true;
  }
  return false;
}

interface Elemento {
  x: number;
  y: number;
  s: number;
}

function repartir(semilla: number, cantidad: number, yMin: number, yMax: number, margen: number, sMin: number, sMax: number): Elemento[] {
  const azar = aleatorio(semilla);
  const lista: Elemento[] = [];
  let intentos = 0;
  while (lista.length < cantidad && intentos < cantidad * 30) {
    intentos++;
    const y = yMin + azar() * (yMax - yMin);
    const [a, b] = bordes(y);
    const x = a + 30 + azar() * (b - a - 60);
    if (cercaDelSendero(x, y, margen)) continue;
    // Más pequeños mientras más arriba: da profundidad.
    lista.push({ x, y, s: sMin + azar() * (sMax - sMin) });
  }
  return lista.sort((p, q) => p.y - q.y);
}

const ARBOLES = repartir(11, 170, 2650, 3600, 70, 0.8, 1.5);
const FRAILEJONES = repartir(23, 150, 1900, 2750, 55, 0.55, 1.1);
const FRAILEJONES_ALTOS = repartir(29, 60, 1000, 1900, 45, 0.4, 0.75);
const PAJONAL = repartir(31, 220, 900, 2000, 30, 0.6, 1.2);
const ROCAS = repartir(37, 40, 560, 1500, 50, 0.6, 1.4);
const LAGUNAS = [
  { x: 760, y: 1990, rx: 150, ry: 34 },
  { x: 1770, y: 1930, rx: 120, ry: 28 },
];

function Simbolos() {
  return (
    <defs>
      <linearGradient id="as-montana" x1="0" y1="520" x2="0" y2="3600" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#8b8e7d" />
        <stop offset="0.18" stopColor="#8a8a62" />
        <stop offset="0.42" stopColor="#6f8557" />
        <stop offset="0.66" stopColor="#4c6c45" />
        <stop offset="0.85" stopColor="#2f4d36" />
        <stop offset="1" stopColor="#1e312b" />
      </linearGradient>
      <linearGradient id="as-laguna" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f8796" />
        <stop offset="1" stopColor="#24505e" />
      </linearGradient>
      <radialGradient id="as-niebla">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <symbol id="as-arbol" viewBox="-40 -90 80 100" overflow="visible">
        <rect x="-3" y="-10" width="6" height="20" fill="#2a2a22" />
        <ellipse cx="0" cy="-40" rx="32" ry="44" fill="#2c5638" />
        <ellipse cx="-12" cy="-52" rx="18" ry="22" fill="#3c7048" />
        <ellipse cx="14" cy="-30" rx="16" ry="18" fill="#264c32" />
      </symbol>
      <symbol id="as-frailejon" viewBox="-40 -120 80 130" overflow="visible">
        <path d="M-5 0 L-4 -78 L4 -78 L5 0 Z" fill="#5b4c3c" />
        <path d="M-5 -10 L5 -16 M-5 -30 L5 -36 M-5 -50 L5 -56" stroke="#776652" strokeWidth="2" />
        {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
          <ellipse key={a} cx="0" cy="-92" rx="7" ry="20" fill={a % 80 === 0 ? '#c3cdb0' : '#a7b593'} transform={`rotate(${a} 0 -82)`} />
        ))}
        <circle cx="0" cy="-82" r="7" fill="#9aa886" />
        <circle cx="-9" cy="-108" r="3.5" fill="#e3c64a" />
        <circle cx="7" cy="-112" r="3" fill="#e3c64a" />
      </symbol>
      <symbol id="as-paja" viewBox="-20 -30 40 32" overflow="visible">
        <path d="M0 0 C -6 -10 -14 -18 -18 -26 M0 0 C -2 -12 -4 -20 -3 -30 M0 0 C 3 -12 8 -20 14 -27 M0 0 C 6 -8 12 -12 19 -16" stroke="#c0b27a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </symbol>
      <symbol id="as-roca" viewBox="-40 -30 80 32" overflow="visible">
        <path d="M-36 0 L-28 -18 L-6 -28 L18 -22 L36 0 Z" fill="#8d8f86" />
        <path d="M-6 -28 L18 -22 L36 0 L10 0 Z" fill="#a4a69b" />
      </symbol>
    </defs>
  );
}

/** Ilustración estática del páramo (todo menos la persona, las nubes y la cámara). */
export const Paisaje = memo(function Paisaje() {
  const trazo = SENDERO.trazo();
  return (
    <g>
      <Simbolos />
      <path d={MONTANA} fill="url(#as-montana)" />
      {/* Roca expuesta en la meseta de la cumbre (en Chingaza no hay nieve) */}
      <path d="M1150 640 C 1200 585 1250 570 1300 572 C 1360 575 1410 610 1440 660 C 1380 640 1330 628 1290 630 C 1240 632 1190 640 1150 640 Z" fill="#9a9b8c" />
      <path d="M1200 600 L1230 590 L1250 606 L1222 612 Z M1330 598 L1360 604 L1352 618 L1326 612 Z" fill="#b4b5a8" />

      {LAGUNAS.map((l) => (
        <g key={l.x}>
          <ellipse cx={l.x} cy={l.y + 6} rx={l.rx + 14} ry={l.ry + 8} fill="#3d5d3f" opacity="0.6" />
          <ellipse cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} fill="url(#as-laguna)" />
          <path d={`M${l.x - l.rx * 0.6} ${l.y - 6} h${l.rx * 0.5} M${l.x - l.rx * 0.1} ${l.y + 8} h${l.rx * 0.6}`} stroke="#d7e7ea" strokeWidth="3" strokeLinecap="round" opacity="0.7" className="motion-safe:animate-[brillo_4s_ease-in-out_infinite]" />
        </g>
      ))}

      {ROCAS.map((r, i) => (
        <use key={`r${i}`} href="#as-roca" x={r.x} y={r.y} width={80 * r.s} height={32 * r.s} transform={`translate(${-40 * r.s} ${-30 * r.s})`} />
      ))}
      {PAJONAL.map((p, i) => (
        <use key={`p${i}`} href="#as-paja" x={p.x} y={p.y} width={40 * p.s} height={32 * p.s} transform={`translate(${-20 * p.s} ${-30 * p.s})`} />
      ))}

      {/* Sendero: base clara y borde para que se lea sobre cualquier zona */}
      <path d={trazo} fill="none" stroke="#3a4a30" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      <path d={trazo} fill="none" stroke="#e7dcbc" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d={trazo} fill="none" stroke="#c9b98e" strokeWidth="2" strokeDasharray="2 14" strokeLinecap="round" />

      {[...FRAILEJONES_ALTOS, ...FRAILEJONES].map((f, i) => (
        <use key={`f${i}`} href="#as-frailejon" x={f.x} y={f.y} width={80 * f.s} height={130 * f.s} transform={`translate(${-40 * f.s} ${-120 * f.s})`} />
      ))}
      {ARBOLES.map((a, i) => (
        <use key={`a${i}`} href="#as-arbol" x={a.x} y={a.y} width={80 * a.s} height={100 * a.s} transform={`translate(${-40 * a.s} ${-90 * a.s})`} />
      ))}

      {/* Postes con la altitud de cada hito */}
      {HITOS.map((h, i) => {
        const p = SENDERO.en(progresoDeHito(i));
        const lado = i % 2 === 0 ? 1 : -1;
        return (
          <g key={h.altitud} transform={`translate(${p.x + 46 * lado} ${p.y})`}>
            <rect x="-3" y="-64" width="6" height="64" fill="#5b4c3c" />
            <rect x="-44" y="-86" width="88" height="30" rx="6" fill="#13201a" />
            <text x="0" y="-65" textAnchor="middle" fontSize="17" fontWeight="800" fill="#dceb6b" fontFamily="Outfit Variable, sans-serif">
              {formatearAltitud(h.altitud)} m
            </text>
          </g>
        );
      })}
    </g>
  );
});

/** Cordilleras lejanas: se mueven más lento que la montaña (paralaje). */
export const Cordilleras = memo(function Cordilleras() {
  return (
    <g>
      <path d="M-3000 1500 C -2400 1250 -1900 1420 -1300 1200 C -800 1020 -400 1300 60 1160 C 420 1050 640 1260 960 1180 C 1300 1100 1560 1250 1900 1080 C 2300 900 2700 1180 3200 1020 C 3800 860 4600 1150 5400 1000 L5400 3600 L-3000 3600 Z" fill="#a9b9b1" />
      <path d="M-3000 1900 C -2300 1700 -1600 1880 -900 1660 C -300 1480 200 1760 700 1600 C 1100 1480 1500 1720 1900 1600 C 2400 1450 2900 1700 3500 1560 C 4200 1400 4800 1640 5400 1520 L5400 3600 L-3000 3600 Z" fill="#8ea397" />
    </g>
  );
});
