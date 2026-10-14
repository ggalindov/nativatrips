import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import type { Sendero } from '@/domain/sendero';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { FlechaAccion } from '@/ui/Boton';
import { itemEscalonado } from '@/ui/movimiento';

const COLOR_DIFICULTAD: Record<Sendero['dificultad'], string> = {
  Fácil: 'bg-lima text-bosque',
  Moderado: 'bg-lima-suave text-bosque',
  Difícil: 'bg-white text-bosque',
  Exigente: 'bg-bosque text-lima border border-lima/40',
};

export function PildoraDificultad({ dificultad }: { dificultad: Sendero['dificultad'] }) {
  const { t } = useIdioma();
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase shadow-sm ${COLOR_DIFICULTAD[dificultad]}`}>
      {t.dificultad[dificultad]}
    </span>
  );
}

interface Props {
  sendero: Sendero;
  numero?: number;
  onVistaRapida?: (s: Sendero) => void;
}

export function TarjetaSendero({ sendero: s, numero, onVistaRapida }: Props) {
  const f = fotoDeSendero(s.id);
  const { t } = useIdioma();
  const c = useContenido();
  return (
    <motion.li variants={itemEscalonado} className="list-none">
      <motion.article
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="tarjeta group relative flex h-full flex-col overflow-hidden"
      >
        <div className="relative h-56 overflow-hidden">
          <img
            src={f.srcPequena}
            alt={c.alt(f)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bosque/80 via-bosque/10 to-transparent" />
          <div className="absolute inset-x-4 top-4 flex items-start justify-between">
            {numero !== undefined && (
              <span className="rounded-full bg-bosque/70 px-2.5 py-1 font-cifras text-xs font-black text-lima-suave backdrop-blur">
                {String(numero).padStart(2, '0')}
              </span>
            )}
            <PildoraDificultad dificultad={s.dificultad} />
          </div>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
            <span className="text-xs font-semibold tracking-wide text-white/80 uppercase">{s.sector ?? t.sendero.parque}</span>
            {s.altitudMaxM !== null && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold backdrop-blur">▲ {c.metros(s.altitudMaxM)}</span>
            )}
          </div>
          {onVistaRapida && (
            <button
              type="button"
              onClick={() => onVistaRapida(s)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-bosque opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 focus-visible:opacity-100"
            >
              {t.sendero.vistaRapida}
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <h3 className="m-0 font-display text-2xl leading-tight font-bold tracking-tight">{s.nombre}</h3>
          <p className="m-0 line-clamp-2 text-sm leading-relaxed text-tinta">{s.descripcion}</p>
          <dl className="m-0 grid grid-cols-3 gap-3 rounded-2xl bg-arena px-4 py-3 text-sm">
            {[
              [t.sendero.duracion, c.duracion(s.duracionHoras)],
              [t.sendero.distancia, c.distancia(s.distanciaKm)],
              [t.sendero.desnivel, c.metros(s.desnivelM)],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse gap-0.5">
                <dt className="text-[11px] text-tinta-suave">{k}</dt>
                <dd className="m-0 font-mono font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-tinta-suave">{t.sendero.desdePersona}</span>
              <span className="font-display text-lg font-extrabold">{c.pesos(s.precioPorPersona)}</span>
            </div>
            <Link
              to={`/senderos/${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-bosque px-4 py-2.5 font-display text-sm font-bold text-white no-underline transition-colors after:absolute after:inset-0 hover:bg-lima hover:text-bosque"
            >
              {t.sendero.verSendero} <FlechaAccion />
            </Link>
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}
