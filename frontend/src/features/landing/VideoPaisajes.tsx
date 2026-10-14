import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { foto } from '@/contenido/fotos';
import { EnlaceBoton } from '@/ui/Boton';
import { Aparecer } from '@/ui/movimiento';

/**
 * Video de paisajes del parque en bucle, sin sonido, que arranca solo al
 * cargar la página.
 */
export function VideoPaisajes() {
  const seccion = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [sinVideo, setSinVideo] = useState(false);
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start end', 'end start'] });
  const escala = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.08]);
  const recorte = useTransform(scrollYProgress, [0, 0.35], ['inset(10% 3% 10% 3% round 40px)', 'inset(0% 0% 0% 0% round 0px)']);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.muted = true;
    v.play?.()?.catch(() => undefined);
  }, []);

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
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end gap-6 px-6 pb-20 sm:px-10 lg:px-14">
          <Aparecer>
            <span className="etiqueta text-lima">Chingaza en movimiento</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h2
              id="video-titulo"
              className="m-0 max-w-4xl font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-white sm:text-5xl md:text-[80px]"
            >
              El agua de Bogotá nace aquí.
            </h2>
          </Aparecer>
          <Aparecer retraso={0.2} className="flex flex-wrap items-center gap-4">
            <EnlaceBoton to="/senderos" conFlecha>
              Elegir mi sendero
            </EnlaceBoton>
          </Aparecer>
          <span className="text-xs text-white/50">Video: Parques Nacionales Naturales de Colombia</span>
        </div>
      </motion.div>
    </section>
  );
}
