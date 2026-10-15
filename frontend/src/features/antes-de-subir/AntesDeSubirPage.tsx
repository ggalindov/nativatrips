import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { atributosFoto, foto } from '@/contenido/fotos';
import type { CategoriaEquipaje } from '@/domain/clima';
import { CATEGORIAS_EQUIPAJE, EQUIPAJE, capasRecomendadas, progresoEquipaje, temperaturaEstimada } from '@/domain/clima';
import { useIdioma } from '@/i18n/IdiomaContext';
import { EnlaceBoton } from '@/ui/Boton';
import { Aparecer, CURVA, Escalonado, FotoAnimada, itemEscalonado } from '@/ui/movimiento';

const CATEGORIAS: (CategoriaEquipaje | 'Todo')[] = ['Todo', ...CATEGORIAS_EQUIPAJE];

function AnilloProgreso({ pct }: { pct: number }) {
  const { t } = useIdioma();
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-40 flex-none">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" role="img" aria-label={t.antes.morral.anillo(pct)}>
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
        <span className="text-xs text-white/70">{t.antes.morral.listo}</span>
      </div>
    </div>
  );
}

function Equipaje() {
  const { t } = useIdioma();
  const mo = t.antes.morral;
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
    <section aria-labelledby="equipaje" className="grid grid-cols-[minmax(0,1fr)] gap-8 overflow-hidden rounded-[40px] bg-bosque p-6 text-white md:p-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-5 lg:items-start">
        <AnilloProgreso pct={p.pct} />
        <h2 id="equipaje" className="m-0 font-display text-3xl font-extrabold">{mo.titulo}</h2>
        <p role="status" className="m-0 max-w-[16rem] text-center text-sm text-white/70 lg:text-left">
          {p.faltanObligatorios === 0 ? mo.todoListo : mo.faltan(p.faltanObligatorios)}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMarcados(new Set(EQUIPAJE.map((e) => e.id)))} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            {mo.marcarTodo}
          </button>
          <button type="button" onClick={() => setMarcados(new Set())} className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
            {mo.reiniciar}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div role="group" aria-label={mo.categoria} className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors ${categoria === c ? 'bg-lima text-bosque' : 'bg-bosque-2 text-white/80 hover:text-white'}`}
            >
              {c === 'Todo' ? mo.todo : mo.categorias[c]}
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
                  <span className={`flex-1 text-[15px] ${ok ? 'text-white/60 line-through' : ''}`}>{mo.elementos[e.id]}</span>
                  {e.obligatorio && <span className="text-[10px] font-bold tracking-wider text-lima uppercase">{mo.obligatorio}</span>}
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
  const { t, f } = useIdioma();
  const si = t.antes.simulador;
  const [altitud, setAltitud] = useState(3500);
  const reducido = useReducedMotion();
  const temp = temperaturaEstimada(altitud);
  const alturaTermometro = useMemo(() => Math.max(8, Math.min(100, ((temp + 2) / 18) * 100)), [temp]);

  return (
    <section aria-labelledby="simulador" className="tarjeta grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-5">
        <span className="etiqueta text-tinta-suave">{si.etiqueta}</span>
        <h2 id="simulador" className="m-0 font-display text-3xl font-extrabold">{si.titulo}</h2>
        <p className="m-0 text-[15px] text-tinta">{si.texto}</p>
        <label className="flex flex-col gap-3">
          <span className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">{si.altitud}</span>
            <span className="font-cifras text-2xl font-black">{f.entero(altitud)} m</span>
          </span>
          <input
            type="range"
            min={2600}
            max={4000}
            step={50}
            value={altitud}
            onChange={(e) => setAltitud(Number(e.target.value))}
            className="h-8 w-full cursor-pointer accent-[var(--color-bosque)]"
          />
          <span className="flex justify-between text-xs text-tinta-suave">
            <span>{si.bogota}</span>
            <span>{si.cumbre}</span>
          </span>
        </label>
        <div className="rounded-2xl bg-arena p-4 text-[15px]">
          <span className="font-bold">{si.quePonerte}</span>
          {si.capas[capasRecomendadas(temp)]}
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
            {f.decimal(temp)}°
          </span>
          <span className="text-sm text-tinta-suave">{si.temperatura}</span>
        </div>
      </div>
    </section>
  );
}

export function AntesDeSubirPage() {
  const portada = foto('descenso-niebla');
  const { t } = useIdioma();
  const a = t.antes;
  return (
    <>
      <section className="relative isolate overflow-hidden bg-bosque text-white">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada {...atributosFoto(portada)} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/70 to-transparent" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-36 pb-24 sm:px-8 md:pt-44 md:pb-32 lg:px-12">
          <Aparecer>
            <span className="etiqueta text-lima">{a.etiqueta}</span>
          </Aparecer>
          <Aparecer retraso={0.1}>
            <h1 className="m-0 max-w-3xl font-display text-5xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">{a.titulo}</h1>
          </Aparecer>
          <Aparecer retraso={0.2}>
            <p className="m-0 max-w-xl text-lg text-white/80">{a.texto}</p>
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

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-2">
          <section aria-labelledby="soroche" className="flex flex-col gap-5">
            <Aparecer>
              <span className="etiqueta text-tinta-suave">{a.soroche.etiqueta}</span>
              <h2 id="soroche" className="m-0 mt-2 font-display text-3xl font-extrabold">{a.soroche.titulo}</h2>
            </Aparecer>
            <Escalonado como="ul" className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {a.soroche.items.map(([titulo, d]) => (
                <motion.li key={titulo} variants={itemEscalonado} className="tarjeta flex flex-col gap-1.5 p-5">
                  <span className="font-display text-lg font-bold">{titulo}</span>
                  <span className="text-sm leading-relaxed text-tinta">{d}</span>
                </motion.li>
              ))}
            </Escalonado>
          </section>
          <section aria-labelledby="normas" className="flex flex-col gap-5">
            <Aparecer>
              <span className="etiqueta text-tinta-suave">{a.normas.etiqueta}</span>
              <h2 id="normas" className="m-0 mt-2 font-display text-3xl font-extrabold">{a.normas.titulo}</h2>
            </Aparecer>
            <Escalonado como="ol" className="m-0 flex list-none flex-col gap-2 p-0">
              {a.normas.items.map((n, i) => (
                <motion.li key={n} variants={itemEscalonado} className="flex items-start gap-4 rounded-2xl bg-superficie px-5 py-4 shadow-[var(--shadow-tarjeta)]">
                  <span className="font-cifras text-sm font-black text-ecosistema">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px]">{n}</span>
                </motion.li>
              ))}
            </Escalonado>
          </section>
        </div>

        <Aparecer className="relative overflow-hidden rounded-[40px]">
          <img {...atributosFoto(foto('lagunas-de-siecha'))} loading="lazy" decoding="async" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-bosque/75" />
          <div className="relative flex flex-col items-start gap-4 p-10 text-white md:p-14">
            <span className="etiqueta text-lima">{a.final.etiqueta}</span>
            <h2 className="m-0 max-w-xl font-display text-4xl font-extrabold">{a.final.titulo}</h2>
            <div className="flex flex-wrap gap-3">
              <EnlaceBoton to="/mi-reserva" conFlecha>{a.final.miReserva}</EnlaceBoton>
              <EnlaceBoton to="/senderos" variante="secundarioClaro">{a.final.verSenderos}</EnlaceBoton>
            </div>
          </div>
        </Aparecer>
      </div>
    </>
  );
}
