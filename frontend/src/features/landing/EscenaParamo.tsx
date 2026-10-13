import { opacidadNiebla } from '@/domain/descenso';

const HOJAS = Array.from({ length: 10 }, (_, i) => i * 36);

/** Frailejón: tronco cubierto de hojas secas y roseta de hojas con flor amarilla. */
function Frailejon({ x, y, alto }: { x: number; y: number; alto: number }) {
  const r = alto * 0.22;
  const copa = y - alto;
  return (
    <g>
      <path d={`M${x - 5} ${y} L${x - 4} ${copa + r * 0.6} L${x + 4} ${copa + r * 0.6} L${x + 5} ${y}Z`} fill="#1E312B" />
      <g transform={`translate(${x} ${copa})`}>
        {HOJAS.map((angulo) => (
          <ellipse key={angulo} cx={0} cy={-r * 0.55} rx={r * 0.22} ry={r * 0.62} fill="#7EA56A" transform={`rotate(${angulo})`} />
        ))}
        <circle r={r * 0.32} fill="#93A58C" />
        <circle cy={-r * 0.15} r={Math.max(2.5, r * 0.14)} fill="#DCEB6B" />
      </g>
    </g>
  );
}

/**
 * Ilustración en capas del páramo. Cada capa se desplaza a distinta velocidad
 * según el progreso del descenso: las crestas suben, la laguna aparece y la
 * niebla pasa en el segundo tramo. Es el respaldo ligero de la secuencia de
 * video real cuadro a cuadro.
 */
export function EscenaParamo({ progreso, reducido = false }: { progreso: number; reducido?: boolean }) {
  const p = progreso;
  // Con movimiento reducido las capas no se desplazan: solo cambian de opacidad.
  const capa = (y: number) => (reducido ? undefined : { transform: `translateY(${Math.round(y)}px)`, willChange: 'transform' as const });
  const laguna = reducido ? { opacity: Math.min(1, Math.max(0, (p - 0.55) / 0.3)), transition: 'opacity 400ms' } : capa((1 - p) * 260 - 40);

  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Ilustración del páramo de Chingaza: crestas, niebla, frailejones y una laguna que aparece al descender"
      className="absolute inset-0 h-full w-full"
    >
      <rect width="1440" height="900" fill="#E9E2D2" />
      <g style={capa(p * -40)}>
        <path d="M0 420 L120 360 L260 400 L420 310 L560 372 L700 300 L860 368 L1010 296 L1160 364 L1300 318 L1440 352 L1440 900 L0 900Z" fill="#C9D1BD" />
      </g>
      <g style={capa(p * -120)}>
        <path d="M0 520 L160 452 L300 498 L470 430 L640 492 L780 446 L950 506 L1120 438 L1280 488 L1440 448 L1440 900 L0 900Z" fill="#93A58C" />
      </g>
      <g style={laguna}>
        <path d="M0 640 C 220 600 420 612 640 596 C 860 580 1080 606 1440 584 L1440 900 L0 900Z" fill="#4E6B55" />
        <ellipse cx="760" cy="676" rx="360" ry="44" fill="#1E312B" />
        <ellipse cx="700" cy="668" rx="180" ry="10" fill="#7EA56A" />
      </g>
      <g style={capa(p * -200)}>
        <path d="M0 740 C 260 700 520 724 760 708 C 1000 692 1220 716 1440 698 L1440 900 L0 900Z" fill="#2E4036" />
        <Frailejon x={186} y={716} alto={120} />
        <Frailejon x={265} y={720} alto={86} />
        <Frailejon x={1149} y={710} alto={132} />
        <Frailejon x={1239} y={712} alto={78} />
        <Frailejon x={1299} y={712} alto={62} />
      </g>
      <g style={{ opacity: opacidadNiebla(p) }}>
        <rect x="-40" y="300" width="1520" height="140" fill="#FFFFFF" opacity="0.7" />
        <rect x="-40" y="430" width="1520" height="90" fill="#FFFFFF" opacity="0.5" />
        <rect x="-40" y="230" width="1520" height="60" fill="#FFFFFF" opacity="0.35" />
      </g>
    </svg>
  );
}
