import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { porcentajeOcupacion } from '@/domain/aforo';
import { formatearFechaCorta, hoyIso, sumarDias } from '@/domain/fechas';
import type { CausalReprogramacion, TipoGrupo } from '@/domain/reserva';
import type { EventoPanel } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { atributosFoto, foto } from '@/contenido/fotos';
import { FotoAnimada } from '@/ui/movimiento';

const TIPO_GRUPO: Record<TipoGrupo, string> = {
  ESTANDAR: 'Estándar',
  GRUPO_CORPORATIVO: 'Grupo corporativo',
  NECESIDAD_ESPECIAL: 'Necesidades especiales',
};

const CAUSAL: Record<CausalReprogramacion, string> = {
  INCAPACIDAD_MEDICA: 'Incapacidad médica',
  FALLECIMIENTO_FAMILIAR: 'Fallecimiento de familiar',
  FUERZA_MAYOR: 'Fuerza mayor',
};

/** Eventos en vivo que se muestran en el panel; los más viejos se descartan. */
const MAXIMO_EN_VIVO = 8;

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

type EventoConHora = EventoPanel & { recibido: string };

function textoEvento(e: EventoPanel): string {
  if (e.tipo === 'aforo') return `Aforo al ${e.porcentaje} % en ${e.senderoNombre} (${formatearFechaCorta(e.fecha)}): ${e.ocupacion} de ${e.cupoMaximo}`;
  const quien = e.titular ? ` de ${e.titular}` : '';
  if (e.estado === 'EN_REVISION') return `${e.codigo}${quien} espera revisión · ${e.senderoNombre}, ${e.personas} personas`;
  if (e.estado === 'PENDIENTE_PAGO') return `Nueva reserva ${e.codigo}${quien} · ${e.senderoNombre}, ${formatearFechaCorta(e.fecha)}, ${e.personas} personas`;
  if (e.estado === 'CONFIRMADA') return `${e.codigo} confirmada · ${e.senderoNombre}, ${formatearFechaCorta(e.fecha)}`;
  return `${e.codigo} pasó a ${e.estado.toLowerCase().replace('_', ' ')} · ${e.senderoNombre}`;
}

/** Bandeja de reprogramaciones (RF-37, Anexo 16): soporte, aprobación o rechazo con motivo. */
function Reprogramaciones() {
  const { operacion } = useServicios();
  const mensajeDeError = useMensajeError();
  const lista = useConsulta(() => operacion.reprogramaciones(), [operacion]);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [resueltas, setResueltas] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const decidir = async (id: string, aprobar: boolean) => {
    setError(null);
    try {
      await operacion.decidirReprogramacion(id, aprobar, aprobar ? undefined : motivo.trim() || undefined);
      setResueltas((r) => ({ ...r, [id]: aprobar ? 'Nueva fecha aprobada' : 'Rechazada · cancelada sin devolución' }));
      setRechazando(null);
      setMotivo('');
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const verSoporte = async (id: string) => {
    setError(null);
    try {
      const archivo = await operacion.soporteReprogramacion(id);
      window.open(URL.createObjectURL(archivo), '_blank', 'noopener');
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <section aria-labelledby="pa-rep" className="flex flex-col">
      <Titulo id="pa-rep" nota="Anexo 16: solo con causal y soporte; rechazar cancela sin devolución">
        Solicitudes de cambio de fecha
      </Titulo>
      {error && (
        <p role="alert" className="m-0 pb-3 text-sm text-error">
          {error}
        </p>
      )}
      {lista.estado.tipo === 'cargando' && <Cargando />}
      {lista.estado.tipo === 'error' && <ErrorCarga mensaje={lista.estado.mensaje} reintentar={lista.recargar} />}
      {lista.estado.tipo === 'listo' && lista.estado.datos.length === 0 && (
        <p className="m-0 border-t linea py-4 text-[15px] text-tinta-suave">No hay solicitudes de cambio de fecha.</p>
      )}
      {lista.estado.tipo === 'listo' && (
        <ul className="m-0 list-none p-0">
          {lista.estado.datos.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 border-t linea py-4">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-1 md:grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)]">
                <span className="font-mono text-sm">{p.codigo}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">
                    {p.titular} · {p.personas} personas
                  </span>
                  <span className="text-sm text-tinta-suave">
                    {CAUSAL[p.causal]}: {p.descripcion}
                  </span>
                </span>
                <span className="font-mono text-sm">
                  {formatearFechaCorta(p.fechaOriginal)} → {formatearFechaCorta(p.fechaDeseada)}
                </span>
              </div>
              {resueltas[p.id] ? (
                <span role="status" className="font-mono text-[13px] tracking-[0.08em] uppercase">
                  {resueltas[p.id]}
                </span>
              ) : rechazando === p.id ? (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="etiqueta text-tinta-suave">Motivo del rechazo (le llega al titular)</span>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={2}
                      maxLength={500}
                      className="rounded-2xl border border-bosque/15 bg-superficie p-3 text-[15px] focus:border-bosque focus:outline-none"
                    />
                  </label>
                  <span className="flex flex-wrap gap-2">
                    <Boton variante="peligro" className="h-11 px-4 text-sm" onClick={() => decidir(p.id, false)}>
                      Rechazar y cancelar
                    </Boton>
                    <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => setRechazando(null)}>
                      Volver
                    </Boton>
                  </span>
                </div>
              ) : (
                <span className="flex flex-wrap gap-2">
                  <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => verSoporte(p.id)}>
                    Ver soporte
                  </Boton>
                  <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => setRechazando(p.id)} aria-label={`Rechazar ${p.codigo}`}>
                    Rechazar
                  </Boton>
                  <Boton className="h-11 px-4 text-sm" onClick={() => decidir(p.id, true)} aria-label={`Aprobar cambio de ${p.codigo}`}>
                    Aprobar nueva fecha
                  </Boton>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HoyAdmin() {
  const mensajeDeError = useMensajeError();
  const { operacion } = useServicios();
  const hoy = useMemo(() => hoyIso(), []);
  const proxima = useMemo(() => sumarDias(hoy, 3), [hoy]);

  const revision = useConsulta(() => operacion.enRevision(), [operacion]);
  const salidas = useConsulta(() => operacion.salidasDelDia(hoy), [operacion, hoy]);
  const aforo = useConsulta(() => operacion.ocupacion(proxima), [operacion, proxima]);
  const [resueltas, setResueltas] = useState<Record<string, 'Aprobada · pago habilitado' | 'Rechazada'>>({});
  const [error, setError] = useState<string | null>(null);
  const [enVivo, setEnVivo] = useState<EventoConHora[]>([]);

  const { recargar: recargarRevision } = revision;
  const { recargar: recargarSalidas } = salidas;
  const { recargar: recargarAforo } = aforo;

  // RF-08 y RF-26: el panel se actualiza solo con cada reserva nueva o alerta de aforo.
  useEffect(
    () =>
      operacion.escucharEventos((e) => {
        const recibido = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        setEnVivo((lista) => [{ ...e, recibido }, ...lista].slice(0, MAXIMO_EN_VIVO));
        if (e.tipo === 'aforo') recargarAforo();
        else if (e.estado === 'EN_REVISION') recargarRevision();
        else if (e.fecha === hoy) recargarSalidas();
      }),
    [operacion, hoy, recargarAforo, recargarRevision, recargarSalidas],
  );

  const resolver = async (id: string, aprobar: boolean) => {
    setError(null);
    try {
      await operacion.resolverRevision(id, aprobar);
      setResueltas((r) => ({ ...r, [id]: aprobar ? 'Aprobada · pago habilitado' : 'Rechazada' }));
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const pendientes = revision.estado.tipo === 'listo' ? revision.estado.datos.filter((r) => !resueltas[r.id]).length : 0;
  const totalSalidas = salidas.estado.tipo === 'listo' ? salidas.estado.datos : [];
  const alertas = enVivo.filter((e) => e.tipo === 'aforo');

  return (
    <div className="flex flex-col gap-12">
      <div className="relative isolate flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-[32px] bg-bosque p-8 text-white md:p-10">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada {...atributosFoto(foto('embalse-chuza'))} alt="" kenBurns prioridad />
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

      <AnimatePresence>
        {alertas.length > 0 && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-1 rounded-3xl border border-advertencia/30 bg-advertencia/10 p-5"
          >
            <span className="font-bold text-advertencia">Aforo cerca del límite</span>
            {alertas.map((a) => (
              <span key={a.recibido + textoEvento(a)} className="text-[15px]">
                {textoEvento(a)}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <section aria-labelledby="pa-vivo" aria-live="polite" className="flex flex-col">
        <Titulo id="pa-vivo" nota="Llega sin recargar la página">
          En vivo
        </Titulo>
        {enVivo.length === 0 ? (
          <p className="m-0 border-t linea py-4 text-[15px] text-tinta-suave">Aún no llegan reservas nuevas en esta sesión.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            <AnimatePresence initial={false}>
              {enVivo.map((e) => (
                <motion.li
                  key={e.recibido + textoEvento(e)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t linea py-3 text-[15px]"
                >
                  <span className="font-mono text-sm text-tinta-suave">{e.recibido}</span>
                  <span className={e.tipo === 'aforo' ? 'font-semibold text-advertencia' : ''}>{textoEvento(e)}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section aria-labelledby="pa-rev" className="flex flex-col">
        <Titulo id="pa-rev" nota="Grupos corporativos y con necesidades especiales, antes del pago">
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
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-5 gap-y-2 border-t linea py-4 md:grid-cols-[110px_minmax(0,1.4fr)_minmax(0,1fr)_90px_210px]">
                <span className="font-mono text-sm">{r.codigo}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">
                    {r.titular} · {r.personas} personas
                  </span>
                  <span className="text-sm text-tinta-suave">
                    {TIPO_GRUPO[r.tipoGrupo]}
                    {r.motivo ? `: ${r.motivo}` : ''}
                  </span>
                </span>
                <span className="text-[15px]">{r.senderoNombre}</span>
                <span className="font-mono text-sm">{formatearFechaCorta(r.fecha)}</span>
                {resueltas[r.id] ? (
                  <span role="status" className="font-mono text-[13px] tracking-[0.08em] uppercase md:text-right">
                    {resueltas[r.id]}
                  </span>
                ) : (
                  <span className="flex gap-2 md:justify-end">
                    <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => resolver(r.id, false)} aria-label={`Rechazar ${r.codigo}`}>
                      Rechazar
                    </Boton>
                    <Boton className="h-11 px-4 text-sm" onClick={() => resolver(r.id, true)} aria-label={`Aprobar ${r.codigo}`}>
                      Aprobar
                    </Boton>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Reprogramaciones />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 xl:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="pa-sal" className="flex flex-col">
          <Titulo id="pa-sal">Salidas de hoy</Titulo>
          {salidas.estado.tipo === 'cargando' && <Cargando />}
          {salidas.estado.tipo === 'error' && <ErrorCarga mensaje={salidas.estado.mensaje} reintentar={salidas.recargar} />}
          {salidas.estado.tipo === 'listo' && totalSalidas.length === 0 && (
            <p className="m-0 border-t linea py-4 text-[15px] text-tinta-suave">Hoy no hay salidas confirmadas.</p>
          )}
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
          {aforo.estado.tipo === 'listo' && aforo.estado.datos.length === 0 && (
            <p className="m-0 border-t linea py-4 text-[15px] text-tinta-suave">Ese día aún no tiene capacidad cargada.</p>
          )}
          {aforo.estado.tipo === 'listo' &&
            aforo.estado.datos.map((a) => {
              const pct = porcentajeOcupacion({ fecha: proxima, limite: a.limite, ocupados: a.ocupados });
              const lleno = a.ocupados >= a.limite;
              const alerta = !lleno && pct >= a.umbralPct;
              return (
                <div key={a.senderoNombre} className="flex flex-col gap-2 border-t linea py-3">
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span>{a.senderoNombre}</span>
                    <span className="font-mono">
                      {a.ocupados}/{a.limite}
                      {(lleno || alerta) && <span className="ml-2 text-xs tracking-[0.08em] uppercase">{lleno ? 'lleno' : 'alerta'}</span>}
                    </span>
                  </div>
                  <div role="img" aria-label={`${a.senderoNombre}: ${pct} % ocupado`} className="h-1.5 bg-bosque/10">
                    <div className={`h-1.5 ${lleno || alerta ? 'bg-lima' : 'bg-pino'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          <span className="pt-2 text-[13px] text-tinta-suave">En amarillo desde el umbral de alerta de cada día (80 % si no se cambia en Capacidad).</span>
        </section>
      </div>
    </div>
  );
}
