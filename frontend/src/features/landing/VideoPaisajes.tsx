import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { atributosFoto, foto } from '@/contenido/fotos';
import { useIdioma } from '@/i18n/IdiomaContext';
import { EnlaceBoton } from '@/ui/Boton';
import { conexionLimitada, pantallaPequena } from '@/ui/conexion';
import { Aparecer } from '@/ui/movimiento';

/**
 * Video de paisajes del parque en bucle y sin sonido. Se descarga cuando la
 * sección está por aparecer, en 480p para celulares, y se pausa cuando sale
 * de la pantalla. Con ahorro de datos o conexión 2G espera a que la persona
 * lo pida y mientras tanto muestra su imagen fija.
 */
export function VideoPaisajes() {
  const seccion = useRef<HTMLElement>(null);
  const { t } = useIdioma();
  const video = useRef<HTMLVideoElement>(null);
  const [sinVideo, setSinVideo] = useState(false);
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start end', 'end start'] });
  const escala = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1, 1.08]);
  const recorte = useTransform(scrollYProgress, [0, 0.35], ['inset(10% 3% 10% 3% round 40px)', 'inset(0% 0% 0% 0% round 0px)']);

  const cerca = useInView(seccion, { margin: '400px 0px' });
  const [permitido, setPermitido] = useState(() => !conexionLimitada());
  const [descargar, setDescargar] = useState(false);
  const fuente = useMemo(() => (pantallaPequena() ? '/media/chingaza-paisajes-480.mp4' : '/media/chingaza-paisajes.mp4'), []);

  useEffect(() => {
    if (cerca && permitido) setDescargar(true);
  }, [cerca, permitido]);

  useEffect(() => {
    const v = video.current;
    if (!v || !descargar) return;
    v.muted = true;
    if (cerca) v.play?.()?.catch(() => undefined);
    else v.pause?.();
  }, [descargar, cerca]);

  return (
    <section ref={seccion} aria-labelledby="video-titulo" className="relative h-[110svh] bg-bosque">
      <motion.div style={{ clipPath: recorte }} className="sticky top-0 h-svh overflow-hidden">
        {sinVideo && <img {...atributosFoto(foto('laguna-chingaza'))} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />}
        <motion.video
          ref={video}
          onError={() => setSinVideo(true)}
          style={{ scale: escala }}
          className="absolute inset-0 h-full w-full object-cover"
          src={descargar ? fuente : undefined}
          poster="/media/chingaza-paisajes.jpg"
          autoPlay={descargar}
          muted
          loop
          playsInline
          preload={descargar ? 'auto' : 'none'}
          aria-label={t.video.aria}
        />
        {!permitido && (
          <button
            type="button"
            onClick={() => setPermitido(true)}
            className="absolute top-1/3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-bosque/80 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-bosque"
          >
            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lima text-bosque">▶</span>
            {t.video.reproducir}
          </button>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(19_32_26/0.15),rgb(19_32_26/0.75))]" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end gap-6 px-6 pb-20 sm:px-10 lg:px-14">
          <Aparecer>
            <span className="etiqueta text-lima">{t.video.etiqueta}</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h2
              id="video-titulo"
              className="m-0 max-w-4xl font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-white sm:text-5xl md:text-[80px]"
            >
              {t.video.titulo}
            </h2>
          </Aparecer>
          <Aparecer retraso={0.2} className="flex flex-wrap items-center gap-4">
            <EnlaceBoton to="/senderos" conFlecha>
              {t.video.elegir}
            </EnlaceBoton>
          </Aparecer>
          <span className="text-xs text-white/50">{t.video.credito}</span>
        </div>
      </motion.div>
    </section>
  );
}
