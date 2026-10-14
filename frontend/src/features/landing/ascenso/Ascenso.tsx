import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { HITOS, altitudPorProgreso, formatearAltitud, indiceHito } from '@/domain/ascenso';
import { EnlaceBoton } from '@/ui/Boton';
import { CURVA } from '@/ui/movimiento';
import { Cordilleras, MUNDO, Paisaje, SENDERO } from './Paisaje';

const mezclar = (a: number, b: number, t: number) => a + (b - a) * t;
const suave = (t: number) => t * t * (3 - 2 * t);
const tramo = (v: number, desde: number, hasta: number) => Math.min(1, Math.max(0, (v - desde) / (hasta - desde)));

/** Encuadre de la cámara: plano general al inicio, sigue a la persona y se abre al llegar a la cima. */
function encuadre(p: number, x: number, y: number, aspecto: number) {
  const acercar = suave(tramo(p, 0, 0.15));
  const abrir = suave(tramo(p, 0.88, 1));
  let alto = mezclar(3300, 1250, acercar);
  alto = mezclar(alto, 2700, abrir);
  let cx = mezclar(MUNDO.ancho / 2, x, acercar);
  let cy = mezclar(MUNDO.alto / 2 - 150, y - 120, acercar);
  cx = mezclar(cx, 1250, abrir);
  cy = mezclar(cy, 1250, abrir);
  const ancho = alto * aspecto;
  const vx = ancho >= MUNDO.ancho ? MUNDO.ancho / 2 - ancho / 2 : Math.min(MUNDO.ancho - ancho, Math.max(0, cx - ancho / 2));
  const vy = Math.min(MUNDO.alto - alto * 0.92, Math.max(-alto * 0.25, cy - alto * 0.58));
  return { vx, vy, ancho, alto };
}

function Persona() {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="16" ry="4" fill="#13201a" opacity="0.35" />
      <g data-pierna="atras">
        <path d="M0 -26 L-2 -4" stroke="#13201a" strokeWidth="6" strokeLinecap="round" />
        <path d="M-2 -4 L2 0" stroke="#3b2f25" strokeWidth="6" strokeLinecap="round" />
      </g>
      <rect x="-15" y="-52" width="12" height="22" rx="4" fill="#2e4036" />
      <rect x="-15" y="-52" width="12" height="6" rx="3" fill="#dceb6b" />
      <path d="M-4 -50 L2 -26" stroke="#dceb6b" strokeWidth="12" strokeLinecap="round" />
      <g data-pierna="adelante">
        <path d="M0 -26 L2 -4" stroke="#1e312b" strokeWidth="6" strokeLinecap="round" />
        <path d="M2 -4 L7 0" stroke="#3b2f25" strokeWidth="6" strokeLinecap="round" />
      </g>
      <path d="M2 -44 L12 -34 L14 2" stroke="#d8cfb5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M1 -44 L11 -35" stroke="#dceb6b" strokeWidth="5" strokeLinecap="round" />
      <circle cx="2" cy="-60" r="7" fill="#c89b78" />
      <path d="M-6 -63 Q 2 -74 10 -63 Z" fill="#13201a" />
      <path d="M-7 -62 L13 -62" stroke="#13201a" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Nube({ x, y, s, duracion, reducido }: { x: number; y: number; s: number; duracion: number; reducido: boolean }) {
  return (
    <motion.g
      initial={{ x: 0 }}
      animate={reducido ? undefined : { x: [0, 160, 0] }}
      transition={{ duration: duracion, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.85">
        <ellipse cx="0" cy="0" rx="150" ry="38" fill="url(#as-niebla)" />
        <ellipse cx="-70" cy="10" rx="110" ry="30" fill="url(#as-niebla)" />
        <ellipse cx="90" cy="8" rx="120" ry="28" fill="url(#as-niebla)" />
      </g>
    </motion.g>
  );
}

function Condor({ reducido }: { reducido: boolean }) {
  return (
    <motion.g
      animate={reducido ? undefined : { x: [0, 260, 0], y: [0, -40, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g transform="translate(980 380)">
        <motion.path
          d="M-46 0 Q -22 -14 0 0 Q 22 -14 46 0 Q 22 -6 0 4 Q -22 -6 -46 0 Z"
          fill="#1b1f1c"
          animate={reducido ? undefined : { scaleY: [1, 0.55, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="0" cy="-1" r="3" fill="#f2f0e8" />
      </g>
    </motion.g>
  );
}

function Venado() {
  return (
    <g transform="translate(1700 1530) scale(1.3)">
      <path d="M-22 -26 Q -2 -34 18 -26 L22 -6 L18 -6 L16 -20 L-12 -20 L-14 -6 L-18 -6 Z" fill="#8a6a4a" />
      <path d="M18 -26 L26 -44 L32 -44 L28 -28 Z" fill="#8a6a4a" />
      <path d="M27 -44 L24 -56 M29 -44 L34 -55 M24 -56 L20 -60 M34 -55 L38 -60" stroke="#6e5238" strokeWidth="2" strokeLinecap="round" />
      <path d="M-22 -26 L-26 -30" stroke="#f3eee2" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

/**
 * Portada: 160 vh de scroll en celular y 180 vh en escritorio. Una persona sube el sendero del páramo de
 * Chingaza desde el bosque altoandino hasta la cumbre; la cámara la sigue y
 * en cada tramo aparece un dato del parque.
 */
export function Ascenso() {
  const seccion = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const persona = useRef<SVGGElement>(null);
  const lejanas = useRef<SVGGElement>(null);
  const bandera = useRef<SVGGElement>(null);
  const reducido = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start start', 'end end'] });
  const progreso = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.4 });
  const [p, setP] = useState(0);
  useMotionValueEvent(progreso, 'change', (v) => setP(Math.round(v * 400) / 400));

  const introOpacidad = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.13], [0, -60]);
  const cieloAlto = useTransform(progreso, [0, 1], [0, 1]);
  const solY = useTransform(progreso, [0, 1], [120, -40]);

  useEffect(() => {
    let cuadro = 0;
    const pintar = () => {
      cuadro = requestAnimationFrame(pintar);
      const lienzo = svg.current;
      if (!lienzo) return;
      const v = progreso.get();
      const pos = SENDERO.en(v);
      const aspecto = lienzo.clientWidth / Math.max(1, lienzo.clientHeight);
      const c = encuadre(v, pos.x, pos.y, aspecto);
      lienzo.setAttribute('viewBox', `${c.vx.toFixed(1)} ${c.vy.toFixed(1)} ${c.ancho.toFixed(1)} ${c.alto.toFixed(1)}`);
      lejanas.current?.setAttribute('transform', `translate(0 ${(c.vy * 0.45).toFixed(1)})`);
      if (persona.current) {
        persona.current.setAttribute('transform', `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) scale(${1.7 * pos.sentido} 1.7)`);
        // Las piernas se mueven con la distancia recorrida: solo camina cuando hay scroll.
        const fase = Math.sin(v * SENDERO.largo * 0.045) * 26;
        persona.current.querySelector('[data-pierna="adelante"]')?.setAttribute('transform', `rotate(${fase.toFixed(1)} 0 -26)`);
        persona.current.querySelector('[data-pierna="atras"]')?.setAttribute('transform', `rotate(${(-fase).toFixed(1)} 0 -26)`);
      }
      const izada = suave(tramo(v, 0.95, 1));
      bandera.current?.setAttribute('transform', `translate(1262 548) scale(1 ${izada.toFixed(3)})`);
    };
    cuadro = requestAnimationFrame(pintar);
    return () => cancelAnimationFrame(cuadro);
  }, [progreso]);

  const hito = indiceHito(p);
  const actual = HITOS[hito];

  return (
    <section ref={seccion} id="inicio" className="relative h-[160vh] md:h-[180vh]" aria-label="Ascenso por el páramo de Chingaza">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Cielo: amanecer con bruma abajo, azul despejado en lo alto */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#b8d0d6_0%,#e3e9df_55%,#f3ead8_100%)]" />
        <motion.div style={{ opacity: cieloAlto }} className="absolute inset-0 bg-[linear-gradient(180deg,#7fb0c6_0%,#c7dde3_60%,#eef1e9_100%)]" />
        <motion.div style={{ y: solY }} className="absolute top-[12%] right-[14%] size-28 rounded-full bg-[radial-gradient(circle,#fff6d6_0%,#f6e7a8_45%,transparent_70%)] blur-[2px]" />

        <svg ref={svg} viewBox={`0 0 ${MUNDO.ancho} ${MUNDO.alto}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label="Ilustración: una persona sube por un sendero del páramo de Chingaza, entre bosque, frailejones y lagunas, hasta la cumbre">
          <g ref={lejanas}>
            <Cordilleras />
          </g>
          <Nube x={600} y={1050} s={2.2} duracion={40} reducido={reducido} />
          <Nube x={1900} y={700} s={1.6} duracion={52} reducido={reducido} />
          <Paisaje />
          <Venado />
          <Nube x={1500} y={2350} s={2.4} duracion={34} reducido={reducido} />
          <Nube x={500} y={2500} s={1.8} duracion={46} reducido={reducido} />
          <Condor reducido={reducido} />
          <g ref={bandera} transform="translate(1262 548) scale(1 0)">
            <path d="M0 0 L0 -70" stroke="#f3ead8" strokeWidth="4" />
            <path d="M0 -70 L44 -58 L0 -46 Z" fill="#dceb6b" />
          </g>
          <g ref={persona}>
            <Persona />
          </g>
          <Nube x={1200} y={1650} s={1.5} duracion={38} reducido={reducido} />
        </svg>

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#e3e9df]/90 via-[#e3e9df]/50 to-transparent md:h-[45%] md:from-[#e3e9df]/70" />
        {/* Velo inferior para que se lean las tarjetas */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bosque/70 to-transparent" />

        <motion.div style={{ opacity: introOpacidad, y: introY }} className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 pt-28 sm:gap-5 sm:px-8 md:pt-40 lg:px-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-bosque/15 bg-white/70 px-4 py-1.5 text-[11px] font-bold tracking-widest text-bosque uppercase backdrop-blur">
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-ecosistema" />
            PNN Chingaza · La Calera · Cundinamarca
          </span>
          <h1 className="m-0 max-w-[820px] font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-bosque md:text-[84px]">
            Sube el páramo <span className="text-pino">paso a paso.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-relaxed text-tinta">
            Desliza y acompaña a quien sube: del bosque altoandino a la cumbre, con lo que hace único a Chingaza.
          </p>
          <div className="flex flex-wrap gap-3">
            <EnlaceBoton to="/senderos" conFlecha>
              Explorar senderos
            </EnlaceBoton>
          </div>
          <motion.span
            aria-hidden="true"
            animate={reducido ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-tinta"
          >
            Desliza para subir ↓
          </motion.span>
        </motion.div>

        {/* Ruta de hitos */}
        <ol aria-label="Tramos del ascenso" className="absolute top-1/2 right-4 z-10 m-0 hidden -translate-y-1/2 list-none flex-col-reverse gap-4 rounded-3xl border border-white/15 bg-bosque/60 p-4 backdrop-blur-md md:flex lg:right-10">
          {HITOS.map((h, i) => (
            <li key={h.altitud} aria-current={i === hito ? 'step' : undefined} className="flex items-center justify-end gap-3">
              <span className={`text-right text-xs font-bold transition-colors ${i === hito ? 'text-white' : 'text-white/60'}`}>
                {h.zona}
                <span className="block font-mono font-medium">{formatearAltitud(h.altitud)} m</span>
              </span>
              <span className={`block rounded-full transition-all duration-500 ${i <= hito ? 'bg-lima' : 'bg-white/30'} ${i === hito ? 'size-4 ring-4 ring-lima/30' : 'size-2.5'}`} />
            </li>
          ))}
        </ol>

        <div className="absolute inset-x-3 bottom-4 z-10 mx-auto flex max-w-7xl items-end justify-between gap-3 sm:inset-x-8 sm:bottom-6 lg:inset-x-12">
          <div aria-live="polite" className="min-w-0 max-w-[440px] flex-1">
            <AnimatePresence mode="wait">
              <motion.article
                key={hito}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: CURVA }}
                className="rounded-3xl border border-white/15 bg-bosque/80 p-4 text-white shadow-2xl backdrop-blur-md sm:p-6"
              >
                <span className="etiqueta text-lima">
                  {hito + 1}/{HITOS.length} · {actual.zona}
                </span>
                <h2 className="m-0 mt-1.5 font-display text-lg leading-tight font-extrabold sm:text-2xl">{actual.titulo}</h2>
                <p className="m-0 mt-1.5 font-cifras text-lg leading-tight font-black text-lima-suave sm:mt-2 sm:text-3xl">{actual.cifra}</p>
                <p className="m-0 mt-2 hidden text-sm leading-relaxed text-white/80 sm:block">{actual.detalle}</p>
              </motion.article>
            </AnimatePresence>
          </div>
          <div className="flex flex-none flex-col items-end gap-1 rounded-3xl border border-white/15 bg-bosque/80 px-3 py-3 backdrop-blur-md sm:px-6 sm:py-4">
            <span className="font-cifras text-2xl leading-none font-black text-lima-suave tabular-nums sm:text-4xl md:text-5xl" data-testid="altimetro">
              {formatearAltitud(altitudPorProgreso(p))}
            </span>
            <span className="etiqueta text-white/70">m s. n. m.</span>
          </div>
        </div>
        <span className="absolute bottom-1.5 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] text-white/60 sm:block">Datos: Parques Nacionales Naturales de Colombia</span>
      </div>
    </section>
  );
}
