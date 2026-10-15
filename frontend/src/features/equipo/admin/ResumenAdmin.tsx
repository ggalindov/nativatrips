import { useState } from 'react';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { atributosFoto, foto } from '@/contenido/fotos';
import { FotoAnimada } from '@/ui/movimiento';
import { METRICAS } from '../ejemplo';
import { Indicador as IndicadorTendencia } from '../ui';
import { IngresosMensuales, Nps, Procedencia } from './Graficos';

const SEMANA = ['jue', 'vie', 'sáb', 'dom', 'lun', 'mar', 'mié'];

/** Una sola serie (ocupación diaria): un tono, sin leyenda; detalle al pasar o enfocar. */
function OcupacionDiaria({ valores }: { valores: number[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  return (
    <section aria-labelledby="pg-ocup" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="pg-ocup" className="m-0 font-display text-2xl font-bold">
          Ocupación diaria del parque
        </h2>
        <span aria-live="polite" className="min-h-5 font-mono text-sm">
          {activo === null ? 'Pasa el cursor o enfoca una barra' : `${SEMANA[activo % 7]} ${activo + 1}/10 · ${valores[activo]} % del aforo`}
        </span>
      </div>
      {/* En pantallas angostas la gráfica se desliza de lado para que cada barra se pueda tocar. */}
      <div className="-mx-4 overflow-x-auto px-4 pt-5 sm:mx-0 sm:px-0 xl:overflow-visible">
      <div className="relative flex h-60 min-w-[840px] flex-col xl:min-w-0">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-dashed border-bosque/20" />
        <span aria-hidden="true" className="absolute -top-[18px] right-0 font-mono text-[11px] text-tinta-suave">
          100 % aforo
        </span>
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-bosque/10" />
        <div className="relative flex flex-1 items-end gap-0.5 border-b border-bosque/30" onMouseLeave={() => setActivo(null)}>
          {valores.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1} de octubre: ${v} % del aforo`}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              className="flex h-full min-w-0 flex-1 cursor-default flex-col justify-end border-0 bg-transparent px-px"
            >
              <span
                className="block rounded-t-[4px] transition-colors"
                style={{ height: `${v}%`, background: activo === null || activo === i ? 'var(--color-pino)' : 'var(--color-salvia)' }}
              />
            </button>
          ))}
        </div>
        <div aria-hidden="true" className="flex justify-between pt-2 font-mono text-[11px] text-tinta-suave">
          <span>1 oct</span>
          <span>15 oct</span>
          <span>31 oct</span>
        </div>
      </div>
      </div>
    </section>
  );
}

export function ResumenAdmin() {
  const { operacion } = useServicios();
  const { estado, recargar } = useConsulta(() => operacion.resumenGerencia('2026-10'), [operacion]);

  if (estado.tipo === 'cargando') return <Cargando />;
  if (estado.tipo === 'error') return <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />;
  const r = estado.datos;
  const miles = new Intl.NumberFormat('es-CO');

  return (
    <div className="flex flex-col gap-11">
      <div className="relative isolate flex flex-col gap-2 overflow-hidden rounded-[32px] bg-bosque p-8 text-white md:p-10">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada {...atributosFoto(foto('desde-las-nubes'))} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/70 to-bosque/20" />
        </div>
        <span className="etiqueta text-lima">Indicadores · datos de ejemplo</span>
        <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight sm:text-[44px]">Resumen de octubre</h1>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <IndicadorTendencia
          titulo="Ingresos del mes"
          valor={`$${(METRICAS.ingresos / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`}
          tendencia={{ texto: `${Math.round(((METRICAS.ingresos - METRICAS.ingresosMesAnterior) / METRICAS.ingresosMesAnterior) * 100)} %`, positiva: METRICAS.ingresos >= METRICAS.ingresosMesAnterior }}
          nota="frente a septiembre"
        />
        <IndicadorTendencia
          titulo="Tasa de conversión"
          valor={`${METRICAS.conversionPct} %`}
          tendencia={{ texto: `${METRICAS.conversionPct - METRICAS.conversionMesAnterior} pts`, positiva: METRICAS.conversionPct >= METRICAS.conversionMesAnterior }}
          nota="visitas a la reserva que terminan en pago"
        />
        <IndicadorTendencia titulo="NPS" valor={String(METRICAS.nps)} nota={`${METRICAS.respuestasNps} encuestas respondidas`} />
        <IndicadorTendencia titulo="Ocupación promedio" valor={`${r.ocupacionPromedioPct} %`} nota="del aforo autorizado" />
        <IndicadorTendencia titulo="Visitantes" valor={miles.format(r.visitantes)} nota={`en ${miles.format(r.reservas)} reservas`} />
        <IndicadorTendencia titulo="Cancelaciones" valor={`${r.cancelacionesPct} %`} nota="incluye reservas expiradas" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        <IngresosMensuales />
        <Nps />
      </div>

      <OcupacionDiaria valores={r.ocupacionDiariaPct} />

      <Procedencia />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 xl:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="pg-send" className="flex flex-col">
          <h2 id="pg-send" className="m-0 mb-3 font-display text-2xl font-bold">
            Senderos más reservados
          </h2>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
                <th scope="col" className="py-2 font-medium">Sendero</th>
                <th scope="col" className="py-2 text-right font-medium">Visitantes</th>
                <th scope="col" className="w-[38%] py-2 pl-4 font-medium">Ocupación</th>
              </tr>
            </thead>
            <tbody>
              {r.ranking.map((s) => (
                <tr key={s.senderoNombre} className="border-t linea">
                  <td className="py-3">{s.senderoNombre}</td>
                  <td className="py-3 text-right font-mono">{s.visitantes}</td>
                  <td className="py-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 flex-1 bg-bosque/10">
                        <div className="h-1.5 rounded-r-[4px] bg-pino" style={{ width: `${s.ocupacionPct}%` }} />
                      </div>
                      <span className="min-w-10 text-right font-mono text-[13px]">{s.ocupacionPct} %</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="pg-alert" className="flex flex-col">
          <h2 id="pg-alert" className="m-0 mb-3 font-display text-2xl font-bold">
            Alertas de capacidad
          </h2>
          {r.ranking
            .filter((s) => s.ocupacionPct >= 80)
            .map((s) => (
              <div key={s.senderoNombre} className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 border-t linea py-3.5">
                <svg width="20" height="20" viewBox="0 0 20 20" role="img" aria-label="Sobre el umbral" fill="none" stroke="var(--color-advertencia)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2.5 18 17H2Z" />
                  <path d="M10 8v4M10 14.5v.1" />
                </svg>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">
                    {s.senderoNombre} · {s.ocupacionPct} %
                  </span>
                  <span className="text-sm text-tinta-suave">Sobre el umbral de alerta (80 %) en el mes.</span>
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
