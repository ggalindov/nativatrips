import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { foto } from '@/contenido/fotos';
import { EnlaceBoton } from '@/ui/Boton';
import { Aparecer } from '@/ui/movimiento';

/**
 * Video de paisajes del parque en bucle, sin sonido, que arranca solo al
 * cargar la página. Tiene botón de pausa: el movimiento que dura más de cinco
 * segundos debe poder detenerse.
 */
export function VideoPaisajes() {
  const seccion = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [pausado, setPausado] = useState(false);
  const [sinVideo, setSinVideo] = useState(false);
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start end', 'end start'] });
  const escala = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.08]);
  const recorte = useTransform(scrollYProgress, [0, 0.35], ['inset(12% 6% 12% 6% round 48px)', 'inset(0% 0% 0% 0% round 0px)']);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    v.play?.()?.catch(() => setPausado(true));
  }, []);

  const alternar = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPausado(false);
    } else {
      v.pause();
      setPausado(true);
    }
  };

  return (
    <section ref={seccion} aria-labelledby="video-titulo" className="relative h-[110svh] bg-bosque">
      <motion.div style={{ clipPath: recorte }} className="sticky top-0 h-svh overflow-hidden">
        {sinVideo && <img src={foto('laguna-chingaza').src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />}
        <motion.video
          ref={video}
          onError={() => setSinVideo(true)}
          style={{ scale: escala }}
          className="absolute inset-0 h-full w-full object-cover"
          src="/media/chingaza-paisajes.mp4"
          poster="/media/chingaza-paisajes.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Paisajes del PNN Chingaza: lagunas, bosque altoandino y frailejones"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(19_32_26/0.15),rgb(19_32_26/0.75))]" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end gap-6 px-4 pb-20 sm:px-8 lg:px-12">
          <Aparecer>
            <span className="etiqueta text-lima">Chingaza en movimiento</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h2 id="video-titulo" className="m-0 max-w-4xl font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-white md:text-[80px]">
              El agua de Bogotá nace aquí.
            </h2>
          </Aparecer>
          <Aparecer retraso={0.2} className="flex flex-wrap items-center gap-4">
            <EnlaceBoton to="/senderos" conFlecha>
              Elegir mi sendero
            </EnlaceBoton>
            {!sinVideo && <button
              type="button"
              onClick={alternar}
              aria-pressed={pausado}
              className="flex h-12 items-center gap-2 rounded-full border border-white/30 px-5 font-display text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white hover:text-bosque"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                {pausado ? <path d="M7 4v16l13-8z" /> : <path d="M6 4h4v16H6zM14 4h4v16h-4z" />}
              </svg>
              {pausado ? 'Reproducir video' : 'Pausar video'}
            </button>}
          </Aparecer>
          <span className="text-xs text-white/50">Video: Parques Nacionales Naturales de Colombia</span>
        </div>
      </motion.div>
    </section>
  );
}
