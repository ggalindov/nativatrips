import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { DATOS_PARAMO, siguienteDato } from '@/domain/paramo';
import { EnlaceBoton } from '@/ui/Boton';
import { CURVA } from '@/ui/movimiento';
import { Colibri, Condor, OsoAndino, PatoParamo, Rana, Venado } from './Animales';

const ROTACION_MS = 5500;

/** En celulares vertical se muestra más cielo para que el paisaje no se recorte por los lados. */
function useAngosta() {
  const consulta = '(max-aspect-ratio: 4/5)';
  const [angosta, setAngosta] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(consulta).matches === true);
  useEffect(() => {
    const m = window.matchMedia?.(consulta);
    if (!m) return;
    const cambiar = () => setAngosta(m.matches);
    m.addEventListener('change', cambiar);
    return () => m.removeEventListener('change', cambiar);
  }, []);
  return angosta;
}

/** Frailejón del primer plano que se mece con el viento. */
function Frailejon({ x, y, s, animar, retraso }: { x: number; y: number; s: number; animar: boolean; retraso: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-7 0 L-6 -110 L6 -110 L7 0 Z" fill="#5b4c3c" />
      <path d="M-7 -20 L7 -28 M-7 -50 L7 -58 M-7 -80 L7 -88" stroke="#776652" strokeWidth="3" />
      <motion.g
        animate={animar ? { rotate: [-3, 3, -3] } : undefined}
        transition={{
          duration: 5 + retraso,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: retraso,
        }}
        style={{ originX: 0.5, originY: 1 }}
      >
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
          <ellipse key={a} cx="0" cy="-134" rx="8" ry="26" fill={a % 60 === 0 ? '#c3cdb0' : '#a7b593'} transform={`rotate(${a} 0 -120)`} />
        ))}
        <circle cx="0" cy="-120" r="10" fill="#9aa886" />
        <path d="M-6 -150 L-12 -176 M6 -150 L12 -178 M0 -150 L0 -182" stroke="#8a7a52" strokeWidth="2.5" />
        <circle cx="-12" cy="-178" r="7" fill="#e3c64a" />
        <circle cx="12" cy="-180" r="6" fill="#e8cf5c" />
        <circle cx="0" cy="-185" r="6.5" fill="#e3c64a" />
      </motion.g>
    </g>
  );
}

function Nube({ y, s, duracion, retraso, animar }: { y: number; s: number; duracion: number; retraso: number; animar: boolean }) {
  return (
    <motion.g
      initial={{ x: -400 }}
      animate={animar ? { x: [-400, 2000] } : { x: 400 + retraso * 40 }}
      transition={{
        duration: duracion,
        repeat: Infinity,
        ease: 'linear',
        delay: -retraso,
      }}
    >
      <g transform={`translate(0 ${y}) scale(${s})`} fill="#ffffff" opacity="0.85">
        <ellipse cx="0" cy="0" rx="90" ry="26" />
        <ellipse cx="-50" cy="8" rx="60" ry="18" />
        <ellipse cx="56" cy="6" rx="70" ry="20" />
        <ellipse cx="10" cy="-14" rx="46" ry="22" />
      </g>
    </motion.g>
  );
}

/** Capa con paralaje: se desplaza según el puntero y el scroll, más mientras más cerca está. */
function Capa({
  profundidad,
  px,
  py,
  scroll,
  children,
}: {
  profundidad: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  scroll: MotionValue<number>;
  children: React.ReactNode;
}) {
  const x = useTransform(px, (v) => v * profundidad);
  const yPuntero = useTransform(py, (v) => v * profundidad * 0.5);
  const yScroll = useTransform(scroll, (v) => v * profundidad * -1.5);
  const y = useTransform(() => yPuntero.get() + yScroll.get());
  return <motion.g style={{ x, y }}>{children}</motion.g>;
}

/**
 * Portada: el páramo de Chingaza vivo. Animales con movimiento propio,
 * frailejones que se mecen, niebla y nubes. Un scroll corto (media pantalla
 * de recorrido) acerca la cámara a la laguna, cae la tarde, el cóndor cruza
 * el cielo y avanzan los datos del parque; las capas tienen paralaje según
 * el puntero. La fauna se mueve aunque el sistema pida movimiento reducido,
 * porque es el contenido de la portada, y se puede pausar con un botón.
 */
export function ParamoVivo() {
  const seccion = useRef<HTMLElement>(null);
  const [pausado, setPausado] = useState(false);
  const animar = !pausado;
  const [dato, setDato] = useState(0);
  const angosta = useAngosta();

  const px = useSpring(0, { stiffness: 60, damping: 20 });
  const py = useSpring(0, { stiffness: 60, damping: 20 });
  const { scrollYProgress } = useScroll({
    target: seccion,
    offset: ['start start', 'end end'],
  });
  const progreso = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  // La cámara se acerca a la laguna; se escribe directo en el atributo
  // `transform` del grupo SVG para no pasar por los estilos CSS.
  const camara = useRef<SVGGElement>(null);
  useMotionValueEvent(progreso, 'change', (v) => {
    camara.current?.setAttribute('transform', `translate(840 700) scale(${1 + v * 0.3}) translate(-840 -700)`);
  });
  const tarde = useTransform(progreso, [0, 1], [0, 0.6]);
  const solY = useTransform(progreso, [0, 1], [0, 170]);
  const vueloCondor = useTransform(progreso, [0, 1], [0, 520]);
  const textoY = useTransform(progreso, [0, 0.5], [0, -90]);
  const textoOpacidad = useTransform(progreso, [0, 0.45], [1, 0]);
  const pistaOpacidad = useTransform(progreso, [0, 0.12], [1, 0]);

  // El scroll también recorre los datos del parque.
  const ultimoTramo = useRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const tramo = Math.min(DATOS_PARAMO.length - 1, Math.floor(v * DATOS_PARAMO.length));
    if (tramo !== ultimoTramo.current) {
      ultimoTramo.current = tramo;
      setDato(tramo);
    }
  });

  useEffect(() => {
    if (pausado) return;
    const t = setInterval(() => setDato((d) => siguienteDato(d)), ROTACION_MS);
    return () => clearInterval(t);
  }, [pausado]);

  const mover = (e: PointerEvent<HTMLElement>) => {
    if (!animar || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * -2);
    py.set(((e.clientY - r.top) / r.height - 0.5) * -2);
  };

  const actual = DATOS_PARAMO[dato];

  return (
    <MotionConfig reducedMotion="never">
      <section ref={seccion} id="inicio" aria-label="El páramo de Chingaza" className="relative h-[150vh]">
        <div onPointerMove={mover} className="sticky top-0 h-svh min-h-[600px] overflow-hidden bg-[linear-gradient(180deg,#9ec4d4_0%,#d8e4e0_45%,#f3ead8_70%)]">
          <motion.div
            aria-hidden="true"
            style={{ opacity: tarde }}
            className="absolute inset-0 bg-[linear-gradient(180deg,#e9b98a_0%,#f2cf9c_40%,#f6dcb0_65%,transparent_85%)]"
          />
          <svg
            viewBox={angosta ? '0 -360 1600 1480' : '0 0 1600 900'}
            preserveAspectRatio="xMidYMax slice"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Ilustración del páramo de Chingaza con frailejones, una laguna, un oso andino, un venado, un cóndor, un colibrí, un pato y una rana"
          >
            <defs>
              <linearGradient id="pv-laguna" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5d93a1" />
                <stop offset="1" stopColor="#24505e" />
              </linearGradient>
              <radialGradient id="pv-sol">
                <stop offset="0" stopColor="#fffbe8" />
                <stop offset="0.45" stopColor="#f7e9ad" stopOpacity="0.9" />
                <stop offset="1" stopColor="#f7e9ad" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g ref={camara}>
              <Capa profundidad={4} px={px} py={py} scroll={scrollYProgress}>
                <motion.circle cx="1240" cy="180" r="150" fill="url(#pv-sol)" style={{ y: solY }} />
                <Nube y={150} s={1.2} duracion={90} retraso={20} animar={animar} />
                <Nube y={250} s={0.8} duracion={70} retraso={45} animar={animar} />
                <motion.g style={{ x: vueloCondor }}>
                  <Condor animar={animar} x={260} y={200} s={1.1} />
                </motion.g>
              </Capa>

              <Capa profundidad={8} px={px} py={py} scroll={scrollYProgress}>
                <path
                  d="M-100 520 C 120 430 260 470 420 420 C 600 360 760 450 920 400 C 1100 340 1260 430 1420 390 C 1560 360 1640 400 1700 420 L1700 900 L-100 900 Z"
                  fill="#a9b9b1"
                />
              </Capa>

              <Capa profundidad={14} px={px} py={py} scroll={scrollYProgress}>
                <path d="M-100 600 C 150 520 300 580 520 530 C 720 490 860 560 1060 520 C 1260 480 1420 550 1700 510 L1700 900 L-100 900 Z" fill="#8ea397" />
                {/* Sendero con una persona que sube a lo lejos */}
                <path
                  d="M1240 640 C 1300 600 1340 590 1370 560 C 1400 530 1440 520 1500 496"
                  fill="none"
                  stroke="#e7dcbc"
                  strokeWidth="4"
                  strokeDasharray="2 8"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <motion.g
                  animate={
                    animar
                      ? {
                          x: [0, 130, 260],
                          y: [0, -80, -144],
                          opacity: [0, 1, 0],
                        }
                      : { x: 130, y: -80 }
                  }
                  transition={{
                    duration: 24,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <g transform="translate(1240 640)">
                    <circle cx="0" cy="-15" r="3" fill="#c89b78" />
                    <path d="M0 -12 L0 -4" stroke="#dceb6b" strokeWidth="5" strokeLinecap="round" />
                    <path d="M0 -4 L-2 2 M0 -4 L2 2" stroke="#1e312b" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                </motion.g>
              </Capa>

              {/* Niebla que cruza a media altura */}
              <motion.g
                animate={animar ? { x: [-200, 200, -200] } : undefined}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                opacity="0.4"
              >
                <ellipse cx="400" cy="600" rx="420" ry="30" fill="#ffffff" />
                <ellipse cx="1250" cy="570" rx="380" ry="24" fill="#ffffff" />
              </motion.g>

              <Capa profundidad={20} px={px} py={py} scroll={scrollYProgress}>
                <path d="M-100 660 C 200 600 420 640 640 630 C 900 618 1100 600 1320 620 C 1480 634 1600 620 1700 630 L1700 900 L-100 900 Z" fill="#6f8557" />
                {[90, 230, 380, 500, 1180, 1300, 1420, 1540].map((x, i) => (
                  <Frailejon key={x} x={x} y={664 + (i % 3) * 8} s={0.44 + (i % 3) * 0.07} animar={animar} retraso={i * 0.7} />
                ))}
                <Venado animar={animar} x={560} y={636} s={1.15} />
                <OsoAndino animar={animar} x={1000} y={616} />
                {/* arbustos donde se esconde el oso */}
                <g>
                  <ellipse cx="1120" cy="596" rx="84" ry="48" fill="#2f4d36" />
                  <ellipse cx="1186" cy="606" rx="60" ry="36" fill="#3c6040" />
                  <ellipse cx="1070" cy="610" rx="50" ry="26" fill="#284530" />
                  <circle cx="1100" cy="566" r="4" fill="#d9433b" />
                  <circle cx="1150" cy="578" r="4" fill="#d9433b" />
                  <circle cx="1196" cy="590" r="3.5" fill="#d9433b" />
                </g>
                {/* Laguna */}
                <ellipse cx="840" cy="700" rx="300" ry="46" fill="#3d5d3f" opacity="0.5" />
                <ellipse cx="840" cy="694" rx="280" ry="38" fill="url(#pv-laguna)" />
                {[0, 1, 2].map((i) => (
                  <motion.path
                    key={i}
                    d={`M${700 + i * 90} ${684 + i * 8} h${60 - i * 10}`}
                    stroke="#e2eef0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    animate={animar ? { opacity: [0.2, 0.8, 0.2], x: [0, 14, 0] } : { opacity: 0.5 }}
                    transition={{
                      duration: 4 + i,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i,
                    }}
                  />
                ))}
                <PatoParamo animar={animar} x={690} y={700} s={1.3} />
                <Rana animar={animar} x={990} y={748} s={1.1} />
              </Capa>

              <Capa profundidad={32} px={px} py={py} scroll={scrollYProgress}>
                <path d="M-100 780 C 200 740 500 770 800 760 C 1100 750 1400 730 1700 760 L1700 1300 L-100 1300 Z" fill="#3d5a3a" />
                {[120, 300, 460, 1150, 1290, 1460].map((x, i) => (
                  <path
                    key={x}
                    d={`M${x} 790 C ${x - 8} 770 ${x - 18} 760 ${x - 24} 744 M${x} 790 C ${x - 2} 768 ${x - 2} 756 ${x} 740 M${x} 790 C ${x + 6} 770 ${x + 14} 760 ${x + 22} 748`}
                    stroke={i % 2 ? '#c0b27a' : '#a99f6b'}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}
                <Frailejon x={210} y={800} s={1.25} animar={animar} retraso={0} />
                <Frailejon x={390} y={820} s={0.85} animar={animar} retraso={1.2} />
                <Frailejon x={1290} y={800} s={1.15} animar={animar} retraso={0.6} />
                <Frailejon x={1450} y={820} s={0.9} animar={animar} retraso={1.8} />
                <Colibri
                  animar={animar}
                  puntos={[
                    [170, 572],
                    [352, 654],
                    [1252, 582],
                    [1412, 646],
                  ]}
                />
              </Capa>
            </g>
          </svg>

          <motion.div
            aria-hidden="true"
            style={{ opacity: textoOpacidad }}
            className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#dfe9e6]/90 via-[#dfe9e6]/40 to-transparent"
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bosque/60 to-transparent" />

          <motion.div
            style={{ y: textoY, opacity: textoOpacidad }}
            className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 pt-24 sm:gap-5 sm:px-8 sm:pt-28 md:pt-36 lg:px-12"
          >
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: CURVA }}
              className="inline-flex items-center gap-2 rounded-full border border-bosque/15 bg-white/70 px-4 py-1.5 text-[11px] font-bold tracking-widest text-bosque uppercase backdrop-blur"
            >
              <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-ecosistema" />
              PNN Chingaza · La Calera · Cundinamarca
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: CURVA, delay: 0.1 }}
              className="m-0 max-w-[760px] font-display text-[40px] leading-[0.95] font-extrabold tracking-tight text-bosque min-[400px]:text-5xl md:text-[84px]"
            >
              Un páramo <span className="text-pino">que respira.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: CURVA, delay: 0.25 }}
              className="m-0 max-w-[500px] text-base leading-relaxed text-tinta sm:text-lg"
            >
              Trece senderos entre frailejones, lagunas y la casa del oso andino. Cupos limitados para cuidarlo.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: CURVA, delay: 0.4 }}
              className="flex flex-wrap gap-3"
            >
              <EnlaceBoton to="/senderos" conFlecha>
                Explorar senderos
              </EnlaceBoton>
              <EnlaceBoton to="/reservar" variante="oscuro">
                Reservar
              </EnlaceBoton>
            </motion.div>
            <motion.span style={{ opacity: pistaOpacidad }} className="hidden items-center gap-2 text-xs font-bold tracking-widest text-bosque/70 uppercase sm:flex">
              Desliza
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                aria-hidden="true"
                animate={animar ? { y: [0, 4, 0] } : undefined}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </motion.span>
          </motion.div>

          <div className="absolute inset-x-3 bottom-4 z-10 mx-auto flex max-w-7xl items-end justify-between gap-3 sm:inset-x-8 sm:bottom-8 lg:inset-x-12">
            <div aria-live="polite" className="min-w-0 max-w-[460px] flex-1">
              <AnimatePresence mode="wait">
                <motion.article
                  key={dato}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: CURVA }}
                  className="relative overflow-hidden rounded-3xl border border-white/15 bg-bosque/80 p-4 text-white shadow-2xl backdrop-blur-md sm:p-6"
                >
                  <span className="etiqueta text-lima">
                    {dato + 1}/{DATOS_PARAMO.length} · {actual.zona}
                  </span>
                  <h2 className="m-0 mt-1.5 font-display text-lg leading-tight font-extrabold sm:text-2xl">{actual.titulo}</h2>
                  <p className="m-0 mt-1.5 font-cifras text-lg leading-tight font-black text-lima-suave sm:mt-2 sm:text-3xl">{actual.cifra}</p>
                  <p className="m-0 mt-2 hidden text-sm leading-relaxed text-white/80 sm:block">{actual.detalle}</p>
                  {!pausado && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 h-1 bg-lima"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        duration: ROTACION_MS / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </motion.article>
              </AnimatePresence>
            </div>
            <div className="flex flex-none flex-col items-end gap-2">
              <div className="flex" role="group" aria-label="Datos del páramo">
                {DATOS_PARAMO.map((d, i) => (
                  <button
                    key={d.zona}
                    type="button"
                    aria-label={`Ver dato: ${d.zona}`}
                    aria-pressed={i === dato}
                    onClick={() => setDato(i)}
                    className="group flex h-8 min-w-6 items-center justify-center px-[3px]"
                  >
                    <span className={`h-2.5 rounded-full transition-all duration-500 ${i === dato ? 'w-7 bg-lima' : 'w-2.5 bg-white/60 group-hover:bg-white'}`} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPausado((p) => !p)}
                aria-pressed={pausado}
                className="flex h-10 items-center gap-2 rounded-full border border-white/25 bg-bosque/70 px-4 text-xs font-bold text-white backdrop-blur hover:bg-bosque"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  {pausado ? <path d="M7 4v16l13-8z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
                </svg>
                {pausado ? 'Reanudar' : 'Pausar'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
