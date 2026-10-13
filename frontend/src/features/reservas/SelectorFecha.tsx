import type { Disponibilidad } from '@/domain/aforo';
import { cuposLibres, nivelAforo } from '@/domain/aforo';
import { diaDelMes, diaSemana, formatearFecha } from '@/domain/fechas';

interface Props {
  dias: readonly Disponibilidad[];
  seleccionada: string | null;
  onElegir: (fecha: string) => void;
}

export function SelectorFecha({ dias, seleccionada, onElegir }: Props) {
  return (
    <div role="group" aria-label="Elegir fecha" className="grid grid-cols-3 gap-2 sm:grid-cols-7">
      {dias.map((d) => {
        const nivel = nivelAforo(d);
        const libres = cuposLibres(d);
        const activa = d.fecha === seleccionada;
        return (
          <button
            key={d.fecha}
            type="button"
            disabled={nivel === 'lleno'}
            aria-pressed={activa}
            aria-label={`${formatearFecha(d.fecha)}, ${nivel === 'lleno' ? 'sin cupos' : `${libres} cupos`}`}
            onClick={() => onElegir(d.fecha)}
            className={`flex min-h-[84px] flex-col items-start gap-1.5 rounded-2xl border p-3 text-left ${
              activa
                ? 'border-bosque bg-bosque text-arena'
                : nivel === 'lleno'
                  ? 'cursor-not-allowed border-bosque/15 bg-transparent text-tinta-suave/70 line-through'
                  : 'border-bosque/20 bg-superficie text-bosque hover:border-bosque'
            }`}
          >
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase">{diaSemana(d.fecha)}</span>
            <span className="font-display text-[22px] font-bold">{diaDelMes(d.fecha)}</span>
            <span className={`font-mono text-xs ${!activa && nivel === 'alerta' ? 'text-advertencia' : ''}`}>
              {nivel === 'lleno' ? 'Lleno' : `${libres} cupos`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
