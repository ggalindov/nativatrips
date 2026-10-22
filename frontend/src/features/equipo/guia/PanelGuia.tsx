import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { hoyIso, sumarDias } from '@/domain/fechas';
import type { Visitante } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { CURVA } from '@/ui/movimiento';
import { useSesion } from '../SesionContext';
import { useSalir } from '../useSalir';
import { AvisoProvider, Insignia, Pais, formatoFecha, useAviso } from '../ui';

const NOVEDADES = ['Visitante con síntomas de altura', 'Retraso en la salida', 'Cambio de ruta por clima', 'Daño en el sendero', 'Fauna en el sendero', 'Otra novedad'];

function Hoja({ abierta, onCerrar, titulo, children }: { abierta: boolean; onCerrar: () => void; titulo: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {abierta && (
        <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-bosque/60 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-label={titulo}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: CURVA }}
            className="relative flex max-h-[85vh] w-full max-w-[480px] flex-col gap-4 overflow-y-auto rounded-t-[32px] bg-arena px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            <span aria-hidden="true" className="mx-auto h-1.5 w-12 rounded-full bg-bosque/20" />
            <h2 className="m-0 font-display text-2xl font-extrabold">{titulo}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Asistencia({ presentes, total }: { presentes: number; total: number }) {
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>Asistencia</span>
        <span className="font-mono" data-testid="asistencia">
          {presentes}/{total}
        </span>
      </div>
      <div role="img" aria-label={`${presentes} de ${total} presentes`} className="h-1.5 rounded-full bg-arena/20">
        <motion.div className="h-1.5 rounded-full bg-lima" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
    </div>
  );
}

function Hoy() {
  const { operacion } = useServicios();
  const { avisar } = useAviso();
  const mensajeDeError = useMensajeError();
  const hoy = useMemo(() => hoyIso(), []);
  const salida = useConsulta(() => operacion.salidaDelGuia(hoy), [operacion, hoy]);
  const [cambios, setCambios] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [hoja, setHoja] = useState<'novedad' | 'cierre' | null>(null);
  const [tipoNovedad, setTipoNovedad] = useState(NOVEDADES[0]);
  const [detalle, setDetalle] = useState('');
  const [cerradoAhora, setCerradoAhora] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const presente = (v: Visitante) => cambios[v.id] ?? v.presente;
  const alternar = async (v: Visitante) => {
    if (cerrado) return;
    const nuevo = !presente(v);
    setCambios((c) => ({ ...c, [v.id]: nuevo }));
    try {
      await operacion.marcarAsistencia(v, nuevo);
    } catch (err) {
      setCambios((c) => ({ ...c, [v.id]: !nuevo }));
      setError(mensajeDeError(err));
    }
  };

  if (salida.estado.tipo === 'cargando') return <div className="p-6"><Cargando /></div>;
  if (salida.estado.tipo === 'error') return <div className="p-6"><ErrorCarga mensaje={salida.estado.mensaje} reintentar={salida.recargar} /></div>;
  const s = salida.estado.datos;
  const presentes = s ? s.visitantes.filter(presente).length : 0;
  const cerrado = cerradoAhora || (s?.cerrada ?? false);
  const cerrarTour = async () => {
    if (!s) return;
    setCerrando(true);
    setError(null);
    try {
      await operacion.cerrarSalida(s.reservaIds);
      setCerradoAhora(true);
      avisar('Tour cerrado · asistencia guardada');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setHoja(null);
      setCerrando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3.5 bg-bosque px-4 pt-2 pb-6 text-arena">
        {s ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[15px] text-lima">{s.hora} · hoy</span>
              <h1 className="m-0 font-display text-3xl leading-[1.05] font-extrabold tracking-tight">{s.senderoNombre}</h1>
            </div>
            <Asistencia presentes={presentes} total={s.total} />
            {cerrado && <Insignia tono="lima">Tour cerrado · asistencia guardada</Insignia>}
          </>
        ) : (
          <h1 className="m-0 font-display text-3xl font-extrabold">Hoy no tienes salidas asignadas.</h1>
        )}
      </div>
      {s && (
        <>
          {s.requerimientos.length > 0 && (
            <div className="mx-4 mt-4 flex flex-col gap-1.5 rounded-3xl border border-advertencia/25 bg-advertencia/5 p-4">
              <span className="text-sm font-bold text-advertencia">Requerimientos especiales</span>
              {s.requerimientos.map((r) => (
                <span key={r.codigo} className="text-sm">
                  <strong className="font-mono">{r.codigo}:</strong> {r.texto}
                </span>
              ))}
            </div>
          )}
          {s.sinRegistrar > 0 && (
            <p className="mx-4 mt-3 mb-0 text-sm text-tinta-suave">
              {s.sinRegistrar === 1 ? '1 persona aún no registra' : `${s.sinRegistrar} personas aún no registran`} sus datos: pide el documento en la salida.
            </p>
          )}
          <div className="flex items-baseline justify-between px-4 pt-5 pb-2">
            <h2 className="m-0 text-base font-semibold">Lista del grupo</h2>
            <span className="font-mono text-xs text-tinta-suave">Toca para marcar</span>
          </div>
          {error && (
            <p role="alert" className="m-0 px-4 pb-2 text-sm text-error">
              {error}
            </p>
          )}
          <ul className="m-0 flex-1 list-none p-0">
            {s.visitantes.map((v) => {
              const ok = presente(v);
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    aria-pressed={ok}
                    onClick={() => alternar(v)}
                    className="flex min-h-[64px] w-full items-center justify-between gap-3 border-t linea bg-transparent px-4 text-left text-bosque"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Pais codigo={v.pais} />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-base font-medium">{v.nombre}</span>
                        <span className="font-mono text-xs text-tinta-suave">
                          {v.nota}
                          {v.visitasPrevias > 0 ? ` · ${v.visitasPrevias + 1}ª visita` : ' · primera visita'}
                        </span>
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-2xl border-[1.5px] transition-colors ${ok ? 'border-lima bg-lima text-bosque' : 'border-bosque/40 text-transparent'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5 6.5 12 13 4.5" />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-[68px] flex flex-col gap-2 border-t linea bg-superficie px-4 pt-3 pb-3">
            <button type="button" disabled={cerrado} onClick={() => setHoja('cierre')} className="h-12 rounded-full bg-bosque font-semibold text-white disabled:opacity-40">
              {cerrado ? 'Tour cerrado' : 'Cerrar el tour'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setHoja('novedad')} className="h-12 rounded-full border border-bosque bg-transparent font-semibold text-bosque">
                Reportar novedad
              </button>
              <a href="tel:[TELEFONO-EMERGENCIA]" className="flex h-12 items-center justify-center rounded-full bg-error font-semibold text-white no-underline hover:text-white">
                Emergencia
              </a>
            </div>
          </div>

          <Hoja abierta={hoja === 'novedad'} onCerrar={() => setHoja(null)} titulo="Reportar novedad">
            <div role="radiogroup" aria-label="Tipo de novedad" className="flex flex-wrap gap-2">
              {NOVEDADES.map((n) => (
                <button key={n} type="button" role="radio" aria-checked={tipoNovedad === n} onClick={() => setTipoNovedad(n)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tipoNovedad === n ? 'bg-bosque text-lima' : 'bg-superficie text-bosque'}`}>
                  {n}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="etiqueta text-tinta-suave">Detalle</span>
              <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} rows={3} className="rounded-2xl border border-bosque/15 bg-superficie p-3 text-[15px] focus:border-bosque focus:outline-none" />
            </label>
            <button
              type="button"
              onClick={() => {
                setHoja(null);
                setDetalle('');
                avisar(`Novedad enviada a la oficina: ${tipoNovedad.toLowerCase()}`);
              }}
              className="h-12 rounded-full bg-lima font-display font-bold text-bosque"
            >
              Enviar a la oficina
            </button>
          </Hoja>

          <Hoja abierta={hoja === 'cierre'} onCerrar={() => setHoja(null)} titulo="Cerrar el tour">
            <p className="m-0 text-[15px] text-tinta">
              Asistieron <strong>{presentes}</strong> de <strong>{s.total}</strong> personas. Al cerrar, la asistencia queda guardada y las reservas de la salida quedan como realizadas.
            </p>
            <button type="button" disabled={cerrando} onClick={cerrarTour} className="h-12 rounded-full bg-bosque font-semibold text-white disabled:opacity-60">
              {cerrando ? 'Cerrando…' : 'Confirmar cierre'}
            </button>
            <button type="button" onClick={() => setHoja(null)} className="h-12 rounded-full border border-bosque/20 font-semibold">
              Seguir pasando lista
            </button>
          </Hoja>
        </>
      )}
    </>
  );
}

/** Agenda de tours asignados los próximos 7 días (RF-38). */
function Agenda() {
  const { operacion } = useServicios();
  const hoy = useMemo(() => hoyIso(), []);
  const agenda = useConsulta(() => operacion.agendaGuia(hoy, 7), [operacion, hoy]);
  if (agenda.estado.tipo === 'cargando') return <div className="p-6"><Cargando /></div>;
  if (agenda.estado.tipo === 'error') return <div className="p-6"><ErrorCarga mensaje={agenda.estado.mensaje} reintentar={agenda.recargar} /></div>;
  const tours = agenda.estado.datos;
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i));
  return (
    <div className="flex flex-col gap-3 px-4 py-5">
      <h1 className="m-0 font-display text-3xl font-extrabold">Mi agenda</h1>
      <p className="m-0 text-sm text-tinta-suave">Tours asignados los próximos 7 días</p>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {dias.map((fecha, i) => {
          const delDia = tours.filter((t) => t.fecha === fecha);
          return (
            <motion.li
              key={fecha}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 rounded-3xl p-4 ${delDia.length > 0 ? 'bg-superficie shadow-[var(--shadow-tarjeta)]' : 'border border-dashed border-bosque/20'}`}
            >
              <span className="flex w-14 flex-none flex-col items-center">
                <span className="font-mono text-[11px] tracking-[0.1em] text-tinta-suave uppercase">{i === 0 ? 'hoy' : formatoFecha(fecha).split(' ')[0]}</span>
                <span className="font-display text-2xl font-extrabold">{Number(fecha.slice(8))}</span>
              </span>
              {delDia.length > 0 ? (
                <span className="flex min-w-0 flex-col gap-1">
                  {delDia.map((t) => (
                    <span key={t.senderoNombre} className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-semibold">{t.senderoNombre}</span>
                      <span className="text-sm text-tinta-suave">
                        {t.hora} · {t.personas} personas{t.puntoEncuentro ? ` · ${t.puntoEncuentro}` : ''}
                      </span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-sm text-tinta-suave">Día libre</span>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/** Panel móvil del guía: pasar lista, novedades, cierre del tour y agenda. */
export function PanelGuia() {
  const { sesion } = useSesion();
  const salir = useSalir();
  const [vista, setVista] = useState<'hoy' | 'agenda'>('hoy');

  return (
    <AvisoProvider>
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-arena pb-[68px] text-bosque">
        <header className="flex items-center justify-between gap-3 bg-bosque px-4 pt-5 pb-2 text-arena">
          <span className="font-mono text-xs tracking-[0.12em] text-salvia uppercase">Guía · {sesion?.nombre}</span>
          <button type="button" onClick={salir} className="min-h-11 bg-transparent px-2 text-sm text-salvia-clara underline">
            Salir
          </button>
        </header>
        {vista === 'hoy' ? <Hoy /> : <Agenda />}
        <nav aria-label="Panel del guía" className="fixed inset-x-0 bottom-0 z-40 mx-auto grid max-w-[480px] grid-cols-2 border-t linea bg-superficie pb-[env(safe-area-inset-bottom)]">
          {(
            [
              ['hoy', 'Hoy', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 3v2M12 19v2M3 12h2M19 12h2'],
              ['agenda', 'Agenda', 'M8 3v3M16 3v3M4 8h16M5 5h14v15H5z'],
            ] as const
          ).map(([v, texto, d]) => (
            <button key={v} type="button" aria-current={vista === v ? 'page' : undefined} onClick={() => setVista(v)} className={`flex h-[68px] flex-col items-center justify-center gap-1 text-xs font-bold ${vista === v ? 'text-bosque' : 'text-tinta-suave'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
              {texto}
              {vista === v && <motion.span layoutId="guia-pestana" className="h-1 w-6 rounded-full bg-lima" />}
            </button>
          ))}
        </nav>
      </div>
    </AvisoProvider>
  );
}
