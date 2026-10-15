import { motion } from 'motion/react';
import { RESERVA, enlaceGoogleMaps, enlaceWaze, mapaEmbebido } from '@/domain/ubicacion';
import { useIdioma } from '@/i18n/IdiomaContext';
import { clasesBoton, FlechaAccion } from '@/ui/Boton';
import { Contornos } from '@/ui/Contornos';
import { Aparecer } from '@/ui/movimiento';

function IconoWaze() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17a7.5 7.5 0 1 1 14.5-2.7c0 2-1.2 3.3-2.6 3.9" />
      <path d="M9 17.5h4" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="15" cy="18.5" r="1.6" />
      <path d="M10 11h.01M14 11h.01" />
      <path d="M10 13.5a2.8 2.8 0 0 0 4 0" />
    </svg>
  );
}

function IconoPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** Cómo llegar a la reserva: dirección, accesos directos a Waze y Google Maps y el mapa del lugar. */
export function ComoLlegar() {
  const { t, idioma } = useIdioma();
  const l = t.llegar;
  return (
    <section id="como-llegar" aria-labelledby="como-llegar-titulo" className="px-4 py-10 sm:px-8 lg:px-12">
      <div className="relative mx-auto grid max-w-7xl items-stretch gap-10 overflow-hidden rounded-[40px] bg-bosque px-6 py-12 text-white md:px-12 md:py-16 lg:grid-cols-[1fr_1.15fr]">
        <Contornos className="opacity-40" />

        <Aparecer className="relative flex flex-col gap-6">
          <span className="etiqueta text-lima">{l.antetitulo}</span>
          <h2 id="como-llegar-titulo" className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight md:text-[52px]">
            {l.titulo}
          </h2>
          <p className="m-0 max-w-md text-[17px] leading-relaxed text-white/75">{l.texto}</p>

          <address className="flex flex-col gap-1 border-l-2 border-lima pl-4 not-italic">
            <span className="font-display text-lg font-bold">{RESERVA.nombre}</span>
            {RESERVA.direccion.map((linea) => (
              <span key={linea} className="text-[15px] text-white/75">
                {linea}
              </span>
            ))}
            <span className="pt-1 font-mono text-xs text-white/50">
              {RESERVA.latitud}, {RESERVA.longitud} · {RESERVA.plusCode}
            </span>
          </address>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <a href={enlaceWaze()} target="_blank" rel="noopener noreferrer" className={clasesBoton('primario', 'sm:flex-1')}>
              <IconoWaze />
              {l.waze}
              <span className="sr-only"> ({l.ventanaNueva})</span>
            </a>
            <a href={enlaceGoogleMaps()} target="_blank" rel="noopener noreferrer" className={clasesBoton('secundarioClaro', 'sm:flex-1')}>
              <IconoPin />
              {l.maps}
              <span className="sr-only"> ({l.ventanaNueva})</span>
              <FlechaAccion />
            </a>
          </div>

          <p className="m-0 flex items-start gap-2 text-sm text-white/60">
            <span aria-hidden="true" className="mt-1.5 size-1.5 flex-none rounded-full bg-lima" />
            {l.consejo}
          </p>
        </Aparecer>

        <Aparecer retraso={0.15} className="relative min-h-[340px] lg:min-h-[460px]">
          <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/10 bg-bosque-2 shadow-2xl">
            <iframe
              title={l.mapaTitulo}
              src={mapaEmbebido(idioma)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0 [filter:saturate(0.85)_contrast(1.05)]"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.4 }}
            className="pointer-events-none absolute -top-4 right-4 flex items-center gap-3 rounded-2xl bg-lima px-4 py-3 text-bosque shadow-xl"
          >
            <IconoPin />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-bold">{RESERVA.nombre}</span>
              <span className="text-xs font-semibold">{l.etiquetaMapa}</span>
            </span>
          </motion.div>
        </Aparecer>
      </div>
    </section>
  );
}
