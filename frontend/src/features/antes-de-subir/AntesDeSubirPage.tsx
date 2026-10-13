import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { foto } from '@/contenido/fotos';
import type { ElementoEquipaje } from '@/domain/clima';
import { EQUIPAJE, capasRecomendadas, progresoEquipaje, temperaturaEstimada } from '@/domain/clima';
import { formatearAltitud } from '@/domain/descenso';
import { EnlaceBoton } from '@/ui/Boton';
import { Aparecer, CURVA, Escalonado, FotoAnimada, itemEscalonado } from '@/ui/movimiento';

const CATEGORIAS: (ElementoEquipaje['categoria'] | 'Todo')[] = ['Todo', 'Ropa', 'Equipo', 'Comida y agua', 'Documentos'];

function AnilloProgreso({ pct }: { pct: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-40 flex-none">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label={`${pct} % del equipaje listo`}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-bosque-2)" strokeWidth="12" />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="var(--color-lima)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 0.8, ease: CURVA }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="font-cifras text-3xl font-black text-lima-suave">{pct}%</span>
        <span className="text-xs text-white/70">listo</span>
      </div>
    </div>
  );
}

function Equipaje() {
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>('Todo');
  const p = progresoEquipaje(marcados);
  const visibles = EQUIPAJE.filter((e) => categoria === 'Todo' || e.categoria === categoria);
  const alternar = (id: string) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <section aria-labelledby="equipaje" className="grid gap-8 overflow-hidden rounded-[40px] bg-bosque p-6 text-white md:p-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-5 lg:items-start">
        <AnilloProgreso pct={p.pct} />
        <h2 id="equipaje" className="m-0 font-display text-3xl font-extrabold">Tu morral</h2>
        <p role="status" className="m-0 max-w-[16rem] text-center text-sm text-white/70 lg:text-left">
          {p.faltanObligatorios === 0 ? 'Tienes todo lo obligatorio. Buen viaje.' : `Faltan ${p.faltanObligatorios} elementos obligatorios.`}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMarcados(new Set(EQUIPAJE.map((e) => e.id)))} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            Marcar todo
          </button>
          <button type="button" onClick={() => setMarcados(new Set())} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            Reiniciar
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div role="group" aria-label="Categoría" className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${categoria === c ? 'bg-lima text-bosque' : 'bg-bosque-2 text-white/80 hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {visibles.map((e) => {
            const ok = marcados.has(e.id);
            return (
              <motion.li key={e.id} layout transition={{ duration: 0.3 }}>
                <button
                  type="button"
                  aria-pressed={ok}
                  onClick={() => alternar(e.id)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${
                    ok ? 'border-lima/50 bg-lima/10' : 'border-bosque-3 bg-bosque-2 hover:border-white/30'
                  }`}
                >
                  <motion.span
                    aria-hidden="true"
                    animate={{ scale: ok ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex size-6 flex-none items-center justify-center rounded-lg border-2 text-xs font-black ${ok ? 'border-lima bg-lima text-bosque' : 'border-white/30'}`}
                  >
                    {ok ? '✓' : ''}
                  </motion.span>
                  <span className={`flex-1 text-[15px] ${ok ? 'text-white/60 line-through' : ''}`}>{e.nombre}</span>
                  {e.obligatorio && <span className="text-[10px] font-bold tracking-wider text-lima uppercase">Obligatorio</span>}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function SimuladorAltitud() {
  const [altitud, setAltitud] = useState(3500);
  const reducido = useReducedMotion();
  const t = temperaturaEstimada(altitud);
  const alturaTermometro = useMemo(() => Math.max(8, Math.min(100, ((t + 2) / 18) * 100)), [t]);

  return (
    <section aria-labelledby="simulador" className="tarjeta grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-5">
        <span className="etiqueta text-tinta-suave">Simulador de gradiente altitudinal</span>
        <h2 id="simulador" className="m-0 font-display text-3xl font-extrabold">¿Qué tanto frío hace allá arriba?</h2>
        <p className="m-0 text-[15px] text-tinta">
          La temperatura baja cerca de 0,65 °C por cada 100 m. Mueve el control hasta la altitud de tu sendero.
        </p>
        <label className="flex flex-col gap-3">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Altitud</span>
            <span className="font-cifras text-2xl font-black">{formatearAltitud(altitud)} m</span>
          </span>
          <input
            type="range"
            min={2600}
            max={4000}
            step={50}
            value={altitud}
            onChange={(e) => setAltitud(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-[var(--color-bosque)]"
          />
          <span className="flex justify-between text-xs text-tinta-suave">
            <span>Bogotá · 2.600 m</span>
            <span>Cumbre · 4.000 m</span>
          </span>
        </label>
        <div className="rounded-2xl bg-arena p-4 text-[15px]">
          <span className="font-bold">Qué ponerte: </span>
          {capasRecomendadas(t)}
        </div>
      </div>
      <div className="flex items-end gap-5 justify-self-center">
        <div className="relative h-64 w-10 overflow-hidden rounded-full bg-arena-oscura">
          <motion.div
            className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-lima to-ecosistema"
            animate={{ height: `${alturaTermometro}%` }}
            transition={reducido ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 18 }}
          />
        </div>
        <div className="flex flex-col pb-2">
          <span className="font-cifras text-5xl font-black" aria-live="polite">
            {String(t).replace('.', ',')}°
          </span>
          <span className="text-sm text-tinta-suave">temperatura media estimada</span>
        </div>
      </div>
    </section>
  );
}

const SOROCHE = [
  ['Paso constante', 'Pasos cortos y ritmo parejo. Evita trotar en las subidas.'],
  ['Sorbos frecuentes', 'Bebe agua cada 20 a 30 minutos, sin esperar a tener sed.'],
  ['Comida ligera', 'Desayuna liviano y evita el alcohol la noche anterior.'],
  ['Avisa a tiempo', 'Si sientes mareo, dolor de cabeza o náuseas, dile al guía.'],
];

const NORMAS = [
  'No salir del sendero marcado: el suelo del páramo tarda décadas en recuperarse.',
  'No tocar ni arrancar frailejones; crecen cerca de un centímetro al año.',
  'Toda la basura vuelve contigo, incluida la orgánica.',
  'No alimentar animales ni hacer fogatas.',
  'Mantener el grupo junto y seguir las indicaciones del guía.',
];

export function AntesDeSubirPage() {
  const portada = foto('descenso-niebla');
  return (
    <>
      <section className="relative isolate overflow-hidden bg-bosque text-white">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada src={portada.src} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/70 to-transparent" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-36 pb-24 sm:px-8 md:pt-44 md:pb-32 lg:px-12">
          <Aparecer>
            <span className="etiqueta text-lima">Guía pre-tour de alta montaña</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h1 className="m-0 max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">Antes de subir al páramo.</h1>
          </Aparecer>
          <Aparecer retraso={0.2}>
            <p className="m-0 max-w-xl text-lg text-white/80">Equipaje, altura, clima y normas del parque para que el día salga como lo imaginaste.</p>
          </Aparecer>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-8 lg:px-12">
        <Aparecer>
          <Equipaje />
        </Aparecer>
        <Aparecer>
          <SimuladorAltitud />
        </Aparecer>

        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="soroche" className="flex flex-col gap-5">
            <Aparecer>
              <span className="etiqueta text-tinta-suave">Mal de altura</span>
              <h2 id="soroche" className="m-0 mt-2 font-display text-3xl font-extrabold">Cómo evitar el soroche</h2>
            </Aparecer>
            <Escalonado como="ul" className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {SOROCHE.map(([t, d]) => (
                <motion.li key={t} variants={itemEscalonado} className="tarjeta flex flex-col gap-1.5 p-5">
                  <span className="font-display text-lg font-bold">{t}</span>
                  <span className="text-sm leading-relaxed text-tinta">{d}</span>
                </motion.li>
              ))}
            </Escalonado>
          </section>
          <section aria-labelledby="normas" className="flex flex-col gap-5">
            <Aparecer>
              <span className="etiqueta text-tinta-suave">Conservación</span>
              <h2 id="normas" className="m-0 mt-2 font-display text-3xl font-extrabold">Normas del parque</h2>
            </Aparecer>
            <Escalonado como="ol" className="m-0 flex list-none flex-col gap-2 p-0">
              {NORMAS.map((n, i) => (
                <motion.li key={n} variants={itemEscalonado} className="flex items-start gap-4 rounded-2xl bg-superficie px-5 py-4 shadow-[var(--shadow-tarjeta)]">
                  <span className="font-cifras text-sm font-black text-ecosistema">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px]">{n}</span>
                </motion.li>
              ))}
            </Escalonado>
          </section>
        </div>

        <Aparecer className="relative overflow-hidden rounded-[40px]">
          <img src={foto('lagunas-de-siecha').src} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-bosque/75" />
          <div className="relative flex flex-col items-start gap-4 p-10 text-white md:p-14">
            <span className="etiqueta text-lima">¿Todo listo?</span>
            <h2 className="m-0 max-w-xl font-display text-4xl font-extrabold">Revisa tu reserva o elige tu próximo sendero.</h2>
            <div className="flex flex-wrap gap-3">
              <EnlaceBoton to="/mi-reserva" conFlecha>Mi reserva</EnlaceBoton>
              <EnlaceBoton to="/senderos" variante="secundarioClaro">Ver senderos</EnlaceBoton>
            </div>
          </div>
        </Aparecer>
      </div>
    </>
  );
}
