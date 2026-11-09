import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { hoyIso, sumarDias } from '@/domain/fechas';
import type { GuiaEquipo, ReservaDelPanel } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { CabeceraPanel, Insignia, Pais, TituloSeccion, formatoFecha, useAviso } from '../ui';

const DIAS = 7;

interface Salida {
  senderoId: string;
  senderoNombre: string;
  hora: string;
  reservas: ReservaDelPanel[];
  personas: number;
  paises: string[];
}

/** Agrupa las reservas confirmadas de un día por sendero: cada sendero sale una vez al día. */
function salidasDe(reservas: ReservaDelPanel[], dia: string): Salida[] {
  const grupos = new Map<string, Salida>();
  reservas
    .filter((r) => r.fecha === dia && (r.estado === 'CONFIRMADA' || r.estado === 'COMPLETADA'))
    .forEach((r) => {
      const s = grupos.get(r.senderoId) ?? { senderoId: r.senderoId, senderoNombre: r.senderoNombre, hora: r.hora, reservas: [], personas: 0, paises: [] };
      s.reservas.push(r);
      s.personas += r.personas;
      s.paises = [...new Set([...s.paises, ...r.integrantes.map((p) => p.nacionalidad)])];
      grupos.set(r.senderoId, s);
    });
  return [...grupos.values()].sort((a, b) => a.hora.localeCompare(b.hora));
}

const sinGuia = (s: Salida) => s.reservas.filter((r) => r.estado === 'CONFIRMADA' && !r.guiaId).length;

/** Salidas de la semana y asignación de guías a las reservas confirmadas (RF-38). */
export function SalidasAdmin() {
  const { operacion } = useServicios();
  const { avisar } = useAviso();
  const mensajeDeError = useMensajeError();
  const hoy = useMemo(() => hoyIso(), []);
  const dias = useMemo(() => Array.from({ length: DIAS }, (_, i) => sumarDias(hoy, i)), [hoy]);
  const [dia, setDia] = useState(hoy);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => Promise.all([operacion.reservasDelPeriodo(dias[0], dias[DIAS - 1]), operacion.guias()]), [operacion, dias]);
  const consulta = useConsulta(cargar, [cargar]);
  const { recargar, setEstado } = consulta;
  const refrescar = useCallback(() => {
    cargar().then((datos) => setEstado({ tipo: 'listo', datos }), () => undefined);
  }, [cargar, setEstado]);

  useEffect(
    () =>
      operacion.escucharEventos((e) => {
        if (e.tipo === 'reserva') refrescar();
      }),
    [operacion, refrescar],
  );

  const reservas = consulta.estado.tipo === 'listo' ? consulta.estado.datos[0] : [];
  const guias: GuiaEquipo[] = consulta.estado.tipo === 'listo' ? consulta.estado.datos[1] : [];
  const salidas = salidasDe(reservas, dia);
  const pendientes = salidas.filter((s) => sinGuia(s) > 0).length;
  const salidasPorDia = (d: string) => salidasDe(reservas, d).length;
  const cargaGuia = (g: GuiaEquipo) => reservas.filter((r) => r.guiaId === g.id && r.estado === 'CONFIRMADA').length;

  /** Asigna el guía a todas las reservas confirmadas de la salida que no lo tengan ya. */
  const asignar = async (s: Salida, guia: GuiaEquipo) => {
    setError(null);
    setOcupado(s.senderoId);
    try {
      for (const r of s.reservas.filter((x) => x.estado === 'CONFIRMADA' && x.guiaId !== guia.id)) {
        await operacion.asignarGuia(r.id, guia.id);
      }
      avisar(`${guia.nombre} asignado a ${s.senderoNombre} el ${formatoFecha(dia)}`);
      refrescar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Operación" titulo="Salidas y guías" fotoId="camino-niebla">
        <dl className="m-0 flex gap-8">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">salidas el día</dt>
            <dd className="m-0 font-cifras text-[28px] font-black">{salidas.length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">sin guía</dt>
            <dd className={`m-0 font-cifras text-[28px] font-black ${pendientes > 0 ? 'text-lima' : ''}`}>{pendientes}</dd>
          </div>
        </dl>
      </CabeceraPanel>

      <div role="group" aria-label="Día" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {dias.map((d, i) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === dia}
            onClick={() => setDia(d)}
            className={`flex flex-col items-start gap-0.5 rounded-2xl border p-3 text-left transition-colors ${d === dia ? 'border-bosque bg-bosque text-arena' : 'border-bosque/15 bg-superficie hover:border-bosque'}`}
          >
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase">{i === 0 ? 'hoy' : formatoFecha(d).split(' ')[0]}</span>
            <span className="font-display text-xl font-bold">{Number(d.slice(8))}</span>
            {consulta.estado.tipo === 'listo' && <span className="text-xs opacity-70">{salidasPorDia(d)} salidas</span>}
          </button>
        ))}
      </div>

      {consulta.estado.tipo === 'cargando' && <Cargando texto="Cargando las salidas…" />}
      {consulta.estado.tipo === 'error' && <ErrorCarga mensaje={consulta.estado.mensaje} reintentar={recargar} />}

      {consulta.estado.tipo === 'listo' && (
        <>
          <section aria-labelledby="sa-salidas" className="flex flex-col">
            <TituloSeccion id="sa-salidas" nota="Solo las reservas confirmadas salen; el guía recibe la lista del grupo 48 horas antes">
              {`Salidas · ${formatoFecha(dia)}`}
            </TituloSeccion>
            {error && (
              <p role="alert" className="m-0 mb-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </p>
            )}
            {salidas.length === 0 && <p className="m-0 rounded-3xl bg-superficie p-6 text-tinta-suave">No hay reservas confirmadas para este día.</p>}
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {salidas.map((s, i) => {
                const asignados = [...new Set(s.reservas.map((r) => r.guiaNombre).filter(Boolean))];
                const unico = s.reservas.every((r) => r.guiaId === s.reservas[0].guiaId) ? s.reservas[0].guiaId : null;
                const faltan = sinGuia(s);
                return (
                  <motion.li
                    key={s.senderoId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="tarjeta flex flex-col gap-4 p-5 md:flex-row md:items-center"
                  >
                    <span className="font-cifras text-2xl font-black md:w-20">{s.hora}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="font-display text-lg font-bold">{s.senderoNombre}</span>
                      <span className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
                        {s.personas} personas · {s.reservas.length} reserva{s.reservas.length === 1 ? '' : 's'}
                        {s.paises.map((p) => (
                          <Pais key={p} codigo={p} />
                        ))}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        {faltan > 0 ? (
                          <Insignia tono="peligro">
                            {faltan} reserva{faltan === 1 ? '' : 's'} sin guía
                          </Insignia>
                        ) : (
                          <Insignia tono="exito">Lista · {asignados.join(', ')}</Insignia>
                        )}
                        {s.reservas.some((r) => r.requerimientos) && <Insignia tono="info">Con requerimientos especiales</Insignia>}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 md:w-64">
                      <select
                        aria-label={`Guía de ${s.senderoNombre}`}
                        value={unico ?? ''}
                        disabled={ocupado !== null || guias.length === 0}
                        onChange={(e) => {
                          const guia = guias.find((g) => g.id === e.target.value);
                          if (guia) void asignar(s, guia);
                        }}
                        className="h-11 w-full rounded-full border border-bosque/15 bg-arena px-4 text-sm font-semibold focus:border-bosque focus:outline-none"
                      >
                        <option value="">{ocupado === s.senderoId ? 'Asignando…' : unico ? 'Cambiar guía…' : 'Asignar guía…'}</option>
                        {guias.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="sa-guias" className="flex flex-col">
            <TituloSeccion id="sa-guias" nota="Reservas confirmadas asignadas en los próximos 7 días">
              Guías
            </TituloSeccion>
            {guias.length === 0 && <p className="m-0 text-tinta-suave">No hay guías activos.</p>}
            <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
              {guias.map((g) => (
                <li key={g.id} className="tarjeta flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-bosque font-display font-extrabold text-lima">
                      {g.nombre[0]?.toUpperCase()}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{g.nombre}</span>
                      <span className="truncate text-xs text-tinta-suave">{g.correo}</span>
                    </span>
                  </div>
                  <span className="border-t linea pt-3 text-sm">
                    {cargaGuia(g)} reserva{cargaGuia(g) === 1 ? '' : 's'} esta semana
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
