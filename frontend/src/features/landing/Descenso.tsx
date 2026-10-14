import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { foto } from '@/contenido/fotos';
import { urlCuadro } from '@/contenido/secuencia';
import { ETAPAS, altitudPorProgreso, formatearAltitud, indiceEtapa } from '@/domain/descenso';
import { EnlaceBoton } from '@/ui/Boton';
import { CURVA } from '@/ui/movimiento';
import { SecuenciaCanvas } from './SecuenciaCanvas';

/**
 * Portada: 420 vh de scroll sobre un video del páramo convertido en cuadros.
 * Cada posición del scroll muestra un cuadro: al bajar, la cámara gira sobre
 * el paisaje mientras el altímetro desciende de la cumbre a la laguna.
 */
export function Descenso() {
  const ref = useRef<HTMLElement>(null);
  const reducido = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [progreso, setProgreso] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setProgreso(v));

  const textoY = useTransform(scrollYProgress, [0, 0.25], reducido ? [0, 0] : [0, -140]);
  const textoOpacidad = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const etapa = indiceEtapa(progreso);

  return (
    <section ref={ref} id="inicio" className="relative h-[420vh]" aria-label="Descenso por el páramo">
      <div className="sticky top-0 h-svh overflow-hidden bg-bosque">
        <img
          src={urlCuadro(0)}
          alt=""
          aria-hidden="true"
          // Sin los medios generados, la portada muestra una foto del parque.
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = foto('desde-las-nubes').src;
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <SecuenciaCanvas progreso={scrollYProgress} etiqueta="Recorrido entre los frailejones del páramo de Chingaza que avanza al hacer scroll" />

        {/* Velo de marca para que el texto se lea sobre cualquier foto. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(19_32_26/0.6)_0%,rgb(19_32_26/0.15)_45%,rgb(19_32_26/0.8)_100%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-10%] top-1/3 h-40 bg-white/20 blur-3xl motion-safe:animate-[bruma_14s_ease-in-out_infinite]" />

        <motion.div
          style={{ y: textoY, opacity: textoOpacidad }}
          className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 pt-32 sm:px-8 md:pt-40 lg:px-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: CURVA }}
            className="inline-flex items-center gap-2 rounded-full border border-lima/30 bg-bosque/70 px-4 py-1.5 text-[11px] font-bold tracking-widest text-lima uppercase backdrop-blur"
          >
            <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-lima" />
            PNN Chingaza · La Calera · Cundinamarca
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: CURVA, delay: 0.1 }}
            className="m-0 max-w-[900px] font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-white md:text-[88px]"
          >
            El páramo se recorre <span className="text-lima">despacio.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: CURVA, delay: 0.25 }}
            className="m-0 max-w-[560px] text-lg leading-relaxed text-white/85"
          >
            Trece senderos autorizados, cupos limitados por la capacidad de carga del parque y confirmación 100 % digital.
            Sin crear una cuenta.
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
            <EnlaceBoton to="/antes-de-subir" variante="secundarioClaro">
              Antes de subir
            </EnlaceBoton>
          </motion.div>
        </motion.div>

        <div className="absolute inset-x-4 bottom-4 z-10 mx-auto flex max-w-7xl items-end justify-between gap-3 sm:inset-x-8 sm:bottom-6 sm:gap-4 lg:inset-x-12">
          <div aria-live="polite" className="flex max-w-[400px] flex-1 flex-col gap-2 rounded-3xl border border-white/15 bg-bosque/70 px-4 py-3 text-white backdrop-blur-md sm:flex-none sm:px-5 sm:py-4">
            <div className="flex items-center gap-2">
              {ETAPAS.map((e, i) => (
                <span key={e.nombre} aria-hidden="true" className={`h-1 rounded-full transition-all duration-500 ${i === etapa ? 'w-8 bg-lima' : 'w-3 bg-white/30'}`} />
              ))}
              <span className="etiqueta ml-1 text-lima">
                {etapa + 1}/4 · {ETAPAS[etapa].nombre}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={etapa}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: CURVA }}
                className="hidden text-[15px] leading-snug text-white/90 sm:block"
              >
                {ETAPAS[etapa].texto}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-end gap-1 rounded-3xl border border-white/15 bg-bosque/70 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
            <span className="font-cifras text-2xl leading-none font-black text-lima-suave tabular-nums sm:text-4xl md:text-5xl" data-testid="altimetro">
              {formatearAltitud(altitudPorProgreso(progreso))}
            </span>
            <span className="etiqueta text-white/70">m s. n. m.<span className="hidden sm:inline"> · desliza para descender</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}
