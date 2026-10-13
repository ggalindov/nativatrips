import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { foto, fotoDeSendero } from '@/contenido/fotos';
import type { Dificultad, Sendero } from '@/domain/sendero';
import {
  DIFICULTADES,
  buscarSenderos,
  filtrarPorDificultad,
  formatearDistancia,
  formatearDuracion,
  formatearMetros,
  formatearPesos,
  ordenarPorExigencia,
} from '@/domain/sendero';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { EnlaceBoton, FlechaAccion } from '@/ui/Boton';
import { Dialogo } from '@/ui/Dialogo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, Escalonado, FotoAnimada, itemEscalonado } from '@/ui/movimiento';
import { PildoraDificultad, TarjetaSendero } from './TarjetaSendero';

type Vista = 'cuadricula' | 'lista';

function VistaRapida({ sendero, onCerrar }: { sendero: Sendero | null; onCerrar: () => void }) {
  const f = sendero ? fotoDeSendero(sendero.id) : null;
  return (
    <Dialogo abierto={sendero !== null} onCerrar={onCerrar} titulo={sendero ? `Vista rápida: ${sendero.nombre}` : 'Vista rápida'}>
      {sendero && f && (
        <div className="grid md:grid-cols-2">
          <div className="relative h-64 md:h-full">
            <img src={f.src} alt={f.alt} className="h-full w-full object-cover" />
            <div className="absolute top-4 left-4">
              <PildoraDificultad dificultad={sendero.dificultad} />
            </div>
          </div>
          <div className="flex flex-col gap-5 p-8">
            <span className="etiqueta text-tinta-suave">{sendero.sector}</span>
            <h2 className="m-0 font-display text-3xl font-extrabold tracking-tight">{sendero.nombre}</h2>
            <p className="m-0 text-[15px] leading-relaxed text-tinta">{sendero.descripcion}</p>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">Puntos destacados del sendero</span>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {sendero.destacados.map((d) => (
                  <li key={d} className="rounded-full bg-arena px-3 py-1.5 text-sm">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto flex items-end justify-between gap-4 border-t linea pt-5">
              <div className="flex flex-col">
                <span className="text-xs text-tinta-suave">Tarifa por persona</span>
                <span className="font-display text-2xl font-extrabold">{formatearPesos(sendero.precioPorPersona)}</span>
              </div>
              <EnlaceBoton to={`/senderos/${sendero.id}`} conFlecha onClick={onCerrar}>
                Ficha completa
              </EnlaceBoton>
            </div>
          </div>
        </div>
      )}
    </Dialogo>
  );
}

function FilaSendero({ sendero: s }: { sendero: Sendero }) {
  const f = fotoDeSendero(s.id);
  return (
    <motion.li variants={itemEscalonado} className="list-none">
      <Link
        to={`/senderos/${s.id}`}
        className="tarjeta group grid items-center gap-5 overflow-hidden p-3 pr-6 text-bosque no-underline transition-shadow hover:text-bosque hover:shadow-xl sm:grid-cols-[180px_minmax(0,1fr)_auto]"
      >
        <div className="h-36 overflow-hidden rounded-2xl sm:h-28">
          <img src={f.srcPequena} alt={f.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        </div>
        <div className="flex flex-col gap-2 px-2 sm:px-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="m-0 font-display text-xl font-bold">{s.nombre}</h3>
            <PildoraDificultad dificultad={s.dificultad} />
          </div>
          <span className="font-mono text-sm text-tinta">
            {formatearDuracion(s.duracionHoras)} · {formatearDistancia(s.distanciaKm)} · ▲ {formatearMetros(s.altitudMaxM)} · {s.sector}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 px-2 pb-2 sm:flex-col sm:items-end sm:px-0 sm:pb-0">
          <span className="font-display text-lg font-extrabold">{formatearPesos(s.precioPorPersona)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-pino">
            Ver sendero <FlechaAccion />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

export function CatalogoPage() {
  const { senderos } = useServicios();
  const { estado, recargar } = useConsulta(() => senderos.listar(), [senderos]);
  const [texto, setTexto] = useState('');
  const [dificultad, setDificultad] = useState<Dificultad | null>(null);
  const [vista, setVista] = useState<Vista>('cuadricula');
  const [rapida, setRapida] = useState<Sendero | null>(null);
  const portada = foto('paramo-panorama');

  const resultados = useMemo(
    () => (estado.tipo === 'listo' ? filtrarPorDificultad(buscarSenderos(ordenarPorExigencia(estado.datos), texto), dificultad) : []),
    [estado, texto, dificultad],
  );
  const filtrando = texto.trim() !== '' || dificultad !== null;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-bosque text-white">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada src={portada.src} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/70 to-bosque/20" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-24 sm:px-8 md:py-32 lg:px-12">
          <Aparecer>
            <span className="etiqueta text-lima">Explora Chingaza · Catálogo oficial</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h1 className="m-0 max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">
              Trece senderos, un páramo por descubrir.
            </h1>
          </Aparecer>
          <Aparecer retraso={0.2}>
            <p className="m-0 max-w-xl text-lg text-white/80">
              Rutas de baja a alta exigencia, todas con guía local y cupos regulados por capacidad de carga.
            </p>
          </Aparecer>
        </div>
      </section>

      <div className="sticky top-[68px] z-20 border-b linea bg-arena/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-8 lg:px-12">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Buscar sendero</span>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar por nombre, sector o atractivo"
              className="h-12 w-full rounded-full border border-bosque/15 bg-superficie pr-4 pl-11 text-[15px] shadow-sm focus:border-bosque focus:outline-none"
            />
          </label>
          <div role="group" aria-label="Filtrar por dificultad" className="flex flex-wrap gap-1.5">
            {[null, ...DIFICULTADES].map((d) => (
              <button
                key={d ?? 'todas'}
                type="button"
                aria-pressed={dificultad === d}
                onClick={() => setDificultad(d)}
                className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${
                  dificultad === d ? 'bg-bosque text-lima' : 'bg-superficie text-bosque hover:bg-bosque/5'
                }`}
              >
                {d ?? 'Todas'}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Tipo de vista" className="flex rounded-full bg-superficie p-1 shadow-sm">
            {(['cuadricula', 'lista'] as Vista[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vista === v}
                onClick={() => setVista(v)}
                className={`h-9 rounded-full px-4 text-sm font-semibold capitalize transition-colors ${vista === v ? 'bg-lima text-bosque' : 'text-tinta'}`}
              >
                {v === 'cuadricula' ? 'Cuadrícula' : 'Lista'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-8 lg:px-12" aria-label="Resultados">
        {estado.tipo === 'cargando' && <Cargando texto="Cargando senderos…" />}
        {estado.tipo === 'error' && <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />}
        {estado.tipo === 'listo' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p role="status" className="m-0 rounded-full bg-bosque px-4 py-1.5 text-sm font-bold text-lima">
                {resultados.length} {resultados.length === 1 ? 'sendero' : 'senderos'}
              </p>
              {filtrando && (
                <button
                  type="button"
                  onClick={() => {
                    setTexto('');
                    setDificultad(null);
                  }}
                  className="text-sm font-semibold text-pino underline underline-offset-4"
                >
                  Quitar filtros
                </button>
              )}
            </div>
            <AnimatePresence mode="wait">
              {resultados.length === 0 ? (
                <motion.div key="vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tarjeta flex flex-col items-center gap-3 p-12 text-center">
                  <h2 className="m-0 font-display text-2xl font-bold">No encontramos senderos con esos filtros</h2>
                  <p className="m-0 text-tinta">Prueba con otra palabra o quita el filtro de dificultad.</p>
                </motion.div>
              ) : vista === 'cuadricula' ? (
                <Escalonado inmediato key={`c-${texto}-${dificultad}`} como="ul" className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
                  {resultados.map((s, i) => (
                    <TarjetaSendero key={s.id} sendero={s} numero={i + 1} onVistaRapida={setRapida} />
                  ))}
                </Escalonado>
              ) : (
                <Escalonado inmediato key={`l-${texto}-${dificultad}`} como="ul" className="m-0 flex list-none flex-col gap-4 p-0">
                  {resultados.map((s) => (
                    <FilaSendero key={s.id} sendero={s} />
                  ))}
                </Escalonado>
              )}
            </AnimatePresence>
          </>
        )}
      </section>

      <VistaRapida sendero={rapida} onCerrar={() => setRapida(null)} />
    </>
  );
}
