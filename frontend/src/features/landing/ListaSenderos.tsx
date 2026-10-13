import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Dificultad, Sendero } from '@/domain/sendero';
import { DIFICULTADES, filtrarPorDificultad, formatearDistancia, formatearDuracion, ordenarPorExigencia } from '@/domain/sendero';
import { FlechaAccion } from '@/ui/Boton';
import { Contornos } from '@/ui/Contornos';

export function ListaSenderos({ senderos }: { senderos: readonly Sendero[] }) {
  const [filtro, setFiltro] = useState<Dificultad | null>(null);
  const visibles = useMemo(() => filtrarPorDificultad(ordenarPorExigencia(senderos), filtro), [senderos, filtro]);
  const opciones: (Dificultad | null)[] = [null, ...DIFICULTADES];

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Filtrar por dificultad" className="flex flex-wrap gap-2">
        {opciones.map((d) => {
          const activo = filtro === d;
          return (
            <button
              key={d ?? 'todas'}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(d)}
              className={`h-10 rounded-full border px-5 text-sm font-semibold transition-colors ${
                activo ? 'border-bosque bg-bosque text-lima' : 'border-bosque/20 bg-superficie text-bosque hover:border-bosque'
              }`}
            >
              {d ?? 'Todas'}
            </button>
          );
        })}
      </div>

      <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3" aria-label="Senderos">
        {visibles.map((s, i) => (
          <li key={s.id}>
            <Link
              to={`/reservar/${s.id}`}
              className="tarjeta group flex h-full flex-col overflow-hidden text-bosque no-underline transition-transform hover:-translate-y-1 hover:text-bosque"
            >
              <div className="relative flex h-40 items-start justify-between bg-bosque p-5">
                <Contornos className="opacity-60" />
                <span className="relative font-cifras text-sm font-black text-lima-suave">{String(i + 1).padStart(2, '0')}</span>
                <span className="relative rounded-full bg-lima px-3 py-1 text-[11px] font-bold tracking-wide text-bosque uppercase">
                  {s.dificultad}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <h3 className="m-0 font-display text-2xl font-bold tracking-tight">{s.nombre}</h3>
                <dl className="m-0 flex gap-6 text-sm">
                  <div className="flex flex-col-reverse gap-0.5">
                    <dt className="text-tinta-suave">Duración</dt>
                    <dd className="m-0 font-mono font-semibold">{formatearDuracion(s.duracionHoras)}</dd>
                  </div>
                  <div className="flex flex-col-reverse gap-0.5">
                    <dt className="text-tinta-suave">Distancia</dt>
                    <dd className="m-0 font-mono font-semibold">{formatearDistancia(s.distanciaKm)}</dd>
                  </div>
                  <div className="flex flex-col-reverse gap-0.5">
                    <dt className="text-tinta-suave">Salida</dt>
                    <dd className="m-0 font-mono font-semibold">{s.horaSalida}</dd>
                  </div>
                </dl>
                <span className="mt-auto inline-flex items-center gap-1.5 font-display text-[15px] font-bold text-pino group-hover:text-bosque">
                  Ver fechas <FlechaAccion />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
