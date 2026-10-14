import { useMemo, useState } from 'react';
import { nivelAforo, porcentajeOcupacion } from '@/domain/aforo';
import { formatearFechaCorta, hoyIso, sumarDias } from '@/domain/fechas';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { foto } from '@/contenido/fotos';
import { FotoAnimada } from '@/ui/movimiento';

function Titulo({ id, children, nota }: { id: string; children: string; nota?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 pb-3">
      <h2 id={id} className="m-0 font-display text-2xl font-bold">
        {children}
      </h2>
      {nota && <span className="text-sm text-tinta-suave">{nota}</span>}
    </div>
  );
}

export function PanelAdministrativo() {
  const mensajeDeError = useMensajeError();
  const { operacion } = useServicios();
  const hoy = useMemo(() => hoyIso(), []);
  const proxima = useMemo(() => sumarDias(hoy, 3), [hoy]);

  const revision = useConsulta(() => operacion.enRevision(), [operacion]);
  const salidas = useConsulta(() => operacion.salidasDelDia(hoy), [operacion, hoy]);
  const aforo = useConsulta(() => operacion.ocupacion(proxima), [operacion, proxima]);
  const [resueltas, setResueltas] = useState<Record<string, 'Confirmada' | 'Rechazada'>>({});
  const [error, setError] = useState<string | null>(null);

  const resolver = async (codigo: string, aprobar: boolean) => {
    setError(null);
    try {
      await operacion.resolverRevision(codigo, aprobar);
      setResueltas((r) => ({ ...r, [codigo]: aprobar ? 'Confirmada' : 'Rechazada' }));
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const pendientes = revision.estado.tipo === 'listo' ? revision.estado.datos.filter((r) => !resueltas[r.codigo]).length : 0;
  const totalSalidas = salidas.estado.tipo === 'listo' ? salidas.estado.datos : [];

  return (
    <div className="flex flex-col gap-12">
      <div className="relative isolate flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-[32px] bg-bosque p-8 text-white md:p-10">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada src={foto('embalse-chuza').src} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/75 to-bosque/30" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="etiqueta text-lima">{formatearFechaCorta(hoy)} · operación del día</span>
          <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight sm:text-[44px]">Hoy</h1>
        </div>
        <dl className="m-0 flex gap-10">
          {[
            ['salidas', totalSalidas.length],
            ['visitantes', totalSalidas.reduce((s, x) => s + x.personas, 0)],
            ['por revisar', pendientes],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse gap-1">
              <dt className="text-[13px] text-white/70">{k}</dt>
              <dd className={`m-0 font-cifras text-[28px] font-black ${k === 'por revisar' && Number(v) > 0 ? 'text-lima' : 'text-white'}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section aria-labelledby="pa-rev" className="flex flex-col">
        <Titulo id="pa-rev" nota="Pagadas, esperando validación de datos">
          Reservas en revisión
        </Titulo>
        {error && (
          <p role="alert" className="m-0 pb-3 text-sm text-error">
            {error}
          </p>
        )}
        {revision.estado.tipo === 'cargando' && <Cargando />}
        {revision.estado.tipo === 'error' && <ErrorCarga mensaje={revision.estado.mensaje} reintentar={revision.recargar} />}
        {revision.estado.tipo === 'listo' && revision.estado.datos.length === 0 && (
          <p className="m-0 border-t linea py-4 text-[15px] text-tinta-suave">No hay reservas esperando revisión.</p>
        )}
        {revision.estado.tipo === 'listo' && (
          <ul className="m-0 list-none p-0">
            {revision.estado.datos.map((r) => (
              <li key={r.codigo} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-5 gap-y-2 border-t linea py-4 md:grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_70px_210px]">
                <span className="font-mono text-sm">{r.codigo}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{r.titular}</span>
                  <span className="text-sm text-tinta-suave">{r.motivo}</span>
                </span>
                <span className="text-[15px]">{r.senderoNombre}</span>
                <span className="font-mono text-sm">{r.fecha}</span>
                {resueltas[r.codigo] ? (
                  <span role="status" className="font-mono text-[13px] tracking-[0.08em] uppercase md:text-right">
                    {resueltas[r.codigo]}
                  </span>
                ) : (
                  <span className="flex gap-2 md:justify-end">
                    <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => resolver(r.codigo, false)} aria-label={`Rechazar ${r.codigo}`}>
                      Rechazar
                    </Boton>
                    <Boton className="h-11 px-4 text-sm" onClick={() => resolver(r.codigo, true)} aria-label={`Aprobar ${r.codigo}`}>
                      Aprobar
                    </Boton>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 xl:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="pa-sal" className="flex flex-col">
          <Titulo id="pa-sal">Salidas de hoy</Titulo>
          {salidas.estado.tipo === 'cargando' && <Cargando />}
          {salidas.estado.tipo === 'error' && <ErrorCarga mensaje={salidas.estado.mensaje} reintentar={salidas.recargar} />}
          <ul className="m-0 list-none p-0">
            {totalSalidas.map((s) => (
              <li key={s.hora + s.senderoNombre} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-t linea py-3.5">
                <span className="font-mono text-[15px]">{s.hora}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{s.senderoNombre}</span>
                  <span className="text-sm text-tinta-suave">
                    {s.personas} personas · {s.guia ?? 'Sin guía asignado'}
                  </span>
                </span>
                {s.guia === null && <span className="font-mono text-xs tracking-[0.08em] text-error uppercase">Asignar</span>}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pa-afo" className="flex flex-col">
          <Titulo id="pa-afo">{`Aforo · ${formatearFechaCorta(proxima)}`}</Titulo>
          {aforo.estado.tipo === 'cargando' && <Cargando />}
          {aforo.estado.tipo === 'error' && <ErrorCarga mensaje={aforo.estado.mensaje} reintentar={aforo.recargar} />}
          {aforo.estado.tipo === 'listo' &&
            aforo.estado.datos.map((a) => {
              const d = { fecha: proxima, limite: a.limite, ocupados: a.ocupados };
              const pct = porcentajeOcupacion(d);
              const nivel = nivelAforo(d);
              return (
                <div key={a.senderoNombre} className="flex flex-col gap-2 border-t linea py-3">
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span>{a.senderoNombre}</span>
                    <span className="font-mono">
                      {a.ocupados}/{a.limite}
                      {nivel !== 'disponible' && <span className="ml-2 text-xs tracking-[0.08em] uppercase">{nivel}</span>}
                    </span>
                  </div>
                  <div role="img" aria-label={`${a.senderoNombre}: ${pct} % ocupado`} className="h-1.5 bg-bosque/10">
                    <div className={`h-1.5 ${nivel === 'disponible' ? 'bg-pino' : 'bg-lima'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          <span className="pt-2 text-[13px] text-tinta-suave">En amarillo desde el 80 %: umbral de alerta del límite de capacidad.</span>
        </section>
      </div>
    </div>
  );
}
