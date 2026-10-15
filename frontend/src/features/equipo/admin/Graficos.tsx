import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { METRICAS } from '../ejemplo';
import { nombrePais } from '../ui';

/** Colores de datos validados (daltonismo, contraste y luminosidad): verde páramo y ocre, con gris neutro al medio. */
export const COLOR = { verde: '#3a8a5c', ocre: '#c2410c', neutro: '#b4b9b3' } as const;

const millones = (v: number) => `$${(v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
const nombreMes = (iso: string) => new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(`${iso}-15T12:00:00`)).replace('.', '');

/** Encabezado de un gráfico con el botón para verlo como tabla. */
function Marco({ id, titulo, nota, tabla, children }: { id: string; titulo: string; nota?: string; tabla: ReactNode; children: ReactNode }) {
  const [verTabla, setVerTabla] = useState(false);
  return (
    <section aria-labelledby={id} className="tarjeta flex min-w-0 flex-col gap-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="m-0 font-display text-xl font-bold">
            {titulo}
          </h2>
          {nota && <span className="text-sm text-tinta-suave">{nota}</span>}
        </div>
        <button type="button" aria-pressed={verTabla} onClick={() => setVerTabla((v) => !v)} className="rounded-full border border-bosque/15 px-3 py-1.5 text-xs font-bold text-tinta hover:border-bosque">
          {verTabla ? 'Ver gráfico' : 'Ver tabla'}
        </button>
      </div>
      {verTabla ? tabla : children}
    </section>
  );
}

function Tabla({ cabeceras, filas }: { cabeceras: string[]; filas: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
          {cabeceras.map((c, i) => (
            <th key={c} scope="col" className={`py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f) => (
          <tr key={String(f[0])} className="border-t linea">
            {f.map((v, i) => (
              <td key={i} className={`py-2 ${i > 0 ? 'text-right font-mono' : ''}`}>
                {v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Ingresos de los últimos seis meses: una serie, columnas con el valor en la punta. */
export function IngresosMensuales() {
  const datos = METRICAS.ingresosMensuales;
  const maximo = Math.max(...datos.map((d) => d.valor));
  const techo = Math.ceil(maximo / 50_000_000) * 50_000_000;
  const [activo, setActivo] = useState<number | null>(null);
  return (
    <Marco
      id="g-ingresos"
      titulo="Ingresos por mes"
      nota="Pagos aprobados por PayU, en pesos colombianos"
      tabla={<Tabla cabeceras={['Mes', 'Ingresos']} filas={datos.map((d) => [nombreMes(d.mes), millones(d.valor)])} />}
    >
      <div className="relative h-60" onMouseLeave={() => setActivo(null)}>
        {/* Área de trazado: deja abajo el espacio de los meses y arriba el del valor. */}
        <div className="absolute inset-x-0 top-6 bottom-6">
          {[0, 0.5, 1].map((f) => (
            <div key={f} aria-hidden="true" className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${f * 100}%`, transform: 'translateY(50%)' }}>
              <span className="w-14 text-right font-mono text-[11px] whitespace-nowrap text-tinta-suave">{millones(techo * f).replace(',0', '')}</span>
              <span className="h-px flex-1 bg-bosque/10" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 right-0 left-16 flex gap-3">
          {datos.map((d, i) => {
            const alto = (d.valor / techo) * 100;
            const ultimo = i === datos.length - 1;
            return (
              <button
                key={d.mes}
                type="button"
                onMouseEnter={() => setActivo(i)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
                aria-label={`${nombreMes(d.mes)}: ${millones(d.valor)}`}
                className="relative z-10 flex h-full flex-1 cursor-default flex-col items-center bg-transparent"
              >
                <span className="relative flex w-full flex-1 flex-col items-center justify-end pt-6 pb-0">
                  <span className="relative flex h-full w-full items-end justify-center">
                    <motion.span
                      initial={{ height: 0 }}
                      animate={{ height: `${alto}%` }}
                      transition={{ duration: 0.7, delay: i * 0.06 }}
                      className="relative w-full max-w-6 rounded-t-[4px]"
                      style={{ background: COLOR.verde, opacity: activo === null || activo === i ? 1 : 0.45 }}
                    >
                      {(ultimo || activo === i) && <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-xs font-bold whitespace-nowrap">{millones(d.valor)}</span>}
                    </motion.span>
                  </span>
                </span>
                <span className="flex h-6 items-end font-mono text-[11px] text-tinta-suave capitalize">{nombreMes(d.mes)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Marco>
  );
}

/** NPS del mes: el número como titular y la distribución en una barra divergente con leyenda. */
export function Nps() {
  const { nps, respuestasNps, npsDistribucion: d } = METRICAS;
  const total = d.promotores + d.pasivos + d.detractores;
  const partes = [
    { clave: 'Detractores', valor: d.detractores, color: COLOR.ocre, nota: '0 a 6' },
    { clave: 'Pasivos', valor: d.pasivos, color: COLOR.neutro, nota: '7 y 8' },
    { clave: 'Promotores', valor: d.promotores, color: COLOR.verde, nota: '9 y 10' },
  ];
  return (
    <Marco
      id="g-nps"
      titulo="Satisfacción (NPS)"
      nota={`Encuesta al cierre del tour · ${respuestasNps} respuestas`}
      tabla={<Tabla cabeceras={['Grupo', 'Respuestas', '%']} filas={partes.map((p) => [`${p.clave} (${p.nota})`, p.valor, `${Math.round((p.valor / total) * 100)} %`])} />}
    >
      <div className="flex items-end gap-3">
        <span className="font-cifras text-6xl leading-none font-black">{nps}</span>
        <span className="pb-1.5 text-sm text-tinta-suave">de −100 a 100 · excelente sobre 50</span>
      </div>
      <div role="img" aria-label={partes.map((p) => `${p.clave}: ${Math.round((p.valor / total) * 100)} %`).join(', ')} className="flex h-6 gap-[2px] overflow-hidden rounded-[4px]">
        {partes.map((p, i) => (
          <motion.span key={p.clave} initial={{ flexGrow: 0 }} animate={{ flexGrow: p.valor }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ background: p.color, flexBasis: 0 }} />
        ))}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
        {partes.map((p) => (
          <li key={p.clave} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: p.color }} />
            <span>
              {p.clave} <span className="font-mono font-bold">{Math.round((p.valor / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
    </Marco>
  );
}

/** Procedencia de los visitantes: barras horizontales; Colombia en verde, el resto en ocre, con leyenda. */
export function Procedencia() {
  const datos = METRICAS.procedencia;
  const total = datos.reduce((a, d) => a + d.visitantes, 0);
  const extranjeros = total - (datos.find((d) => d.pais === 'CO')?.visitantes ?? 0);
  const maximo = Math.max(...datos.map((d) => d.visitantes));
  return (
    <Marco
      id="g-procedencia"
      titulo="Procedencia de los visitantes"
      nota={`${Math.round((extranjeros / total) * 100)} % extranjeros este mes`}
      tabla={<Tabla cabeceras={['País', 'Visitantes', '%']} filas={datos.map((d) => [nombrePais(d.pais), d.visitantes, `${Math.round((d.visitantes / total) * 100)} %`])} />}
    >
      <ul className="m-0 flex list-none gap-5 p-0 text-sm">
        {[
          ['Colombia', COLOR.verde],
          ['Otros países', COLOR.ocre],
        ].map(([t, c]) => (
          <li key={t} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: c }} />
            {t}
          </li>
        ))}
      </ul>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {datos.map((d, i) => (
          <li key={d.pais} className="grid grid-cols-[110px_minmax(0,1fr)_56px] items-center gap-3 text-sm" title={`${nombrePais(d.pais)}: ${d.visitantes} visitantes`}>
            <span className="truncate">{nombrePais(d.pais)}</span>
            <span className="h-3.5">
              <motion.span
                className="block h-3.5 rounded-r-[4px]"
                initial={{ width: 0 }}
                animate={{ width: `${(d.visitantes / maximo) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.05 }}
                style={{ background: d.pais === 'CO' ? COLOR.verde : COLOR.ocre, minWidth: 4 }}
              />
            </span>
            <span className="text-right font-mono">{d.visitantes}</span>
          </li>
        ))}
      </ul>
    </Marco>
  );
}
