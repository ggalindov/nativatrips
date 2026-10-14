import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { LIMITES, nombreSendero } from './ejemplo';
import type { LimiteCapacidad } from './ejemplo';
import { CabeceraPanel, Cajon, Insignia, Pestanas, TituloSeccion, formatoFecha, useAviso } from './ui';

const UMBRAL = 80;

function Edicion({ limite, onCerrar, onGuardar }: { limite: LimiteCapacidad | null; onCerrar: () => void; onGuardar: (l: LimiteCapacidad) => void }) {
  const [borrador, setBorrador] = useState<LimiteCapacidad | null>(null);
  const actual = borrador?.id === limite?.id ? borrador : limite;
  const cambiar = (campo: keyof LimiteCapacidad, valor: string | number) => actual && setBorrador({ ...actual, [campo]: valor });
  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (actual) onGuardar(actual);
  };
  return (
    <Cajon
      abierto={limite !== null}
      onCerrar={onCerrar}
      titulo={limite ? nombreSendero(limite.senderoId) : ''}
      subtitulo={limite ? `Temporada ${limite.temporada.toLowerCase()} · límite de capacidad de carga` : undefined}
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-limite" className="h-11 px-5 text-sm">
            Guardar límite
          </Boton>
        </>
      }
    >
      {actual && (
        <form id="form-limite" onSubmit={guardar} className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-5">
            <Campo etiqueta="Desde" type="date" value={actual.desde} onChange={(e) => cambiar('desde', e.target.value)} />
            <Campo etiqueta="Hasta" type="date" value={actual.hasta} onChange={(e) => cambiar('hasta', e.target.value)} />
            <Campo etiqueta="Cupo diario" type="number" min={1} value={actual.cupoDiario} onChange={(e) => cambiar('cupoDiario', Number(e.target.value))} ayuda="Visitantes por día" />
            <Campo etiqueta="Máximo por grupo" type="number" min={1} value={actual.maxGrupo} onChange={(e) => cambiar('maxGrupo', Number(e.target.value))} ayuda="Por guía" />
          </div>
          <p className="m-0 rounded-2xl bg-superficie p-4 text-sm text-tinta">
            El sistema rechaza cualquier reserva que supere este cupo y avisa al equipo cuando la ocupación llega al {UMBRAL} %. Los cambios aplican a las reservas nuevas.
          </p>
        </form>
      )}
    </Cajon>
  );
}

/** Límites de capacidad de carga por sendero y temporada (RF-23 a RF-26). */
export function CapacidadPage() {
  const { avisar } = useAviso();
  const [limites, setLimites] = useState(LIMITES);
  const [temporada, setTemporada] = useState<LimiteCapacidad['temporada']>('Media');
  const [editando, setEditando] = useState<string | null>(null);
  const visibles = limites.filter((l) => l.temporada === temporada);
  const alertas = limites.filter((l) => l.ocupacionPct >= UMBRAL).sort((a, b) => b.ocupacionPct - a.ocupacionPct);

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Autoridad ambiental · capacidad de carga" titulo="Capacidad" fotoId="espeletias-laguna">
        <dl className="m-0 flex gap-8">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">senderos en alerta</dt>
            <dd className="m-0 font-cifras text-[28px] font-black text-lima">{alertas.length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">umbral de alerta</dt>
            <dd className="m-0 font-cifras text-[28px] font-black">{UMBRAL} %</dd>
          </div>
        </dl>
      </CabeceraPanel>

      {alertas.length > 0 && (
        <section aria-labelledby="cap-alertas" className="flex flex-col">
          <TituloSeccion id="cap-alertas" nota="Ocupación de la semana sobre el límite de la temporada">
            Alertas activas
          </TituloSeccion>
          <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-center gap-4 rounded-3xl border border-advertencia/25 bg-advertencia/5 p-4">
                <svg width="22" height="22" viewBox="0 0 20 20" role="img" aria-label="Alerta" fill="none" stroke="var(--color-advertencia)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                  <path d="M10 2.5 18 17H2Z" />
                  <path d="M10 8v4M10 14.5v.1" />
                </svg>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{nombreSendero(a.senderoId)}</span>
                  <span className="text-sm text-tinta-suave">{a.ocupacionPct} % del cupo · temporada {a.temporada.toLowerCase()}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="cap-limites" className="flex flex-col gap-4">
        <TituloSeccion id="cap-limites" accion={<Pestanas etiqueta="Temporada" valor={temporada} onCambio={setTemporada} opciones={(['Alta', 'Media', 'Baja'] as const).map((v) => ({ valor: v, texto: `Temporada ${v.toLowerCase()}` }))} />}>
          Límites por sendero
        </TituloSeccion>
        <span className="-mt-2 text-sm text-tinta-suave">
          {visibles[0] && `Vigencia: ${formatoFecha(visibles[0].desde)} al ${formatoFecha(visibles[0].hasta)}`}
        </span>
        <div className="tarjeta relative overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
                <th scope="col" className="px-5 py-3 font-medium">Sendero</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Cupo diario</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Máx. grupo</th>
                <th scope="col" className="w-[30%] px-3 py-3 font-medium">Ocupación</th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((l) => {
                const alerta = l.ocupacionPct >= UMBRAL;
                return (
                  <tr key={l.id} className="border-t linea">
                    <td className="px-5 py-3 font-semibold">{nombreSendero(l.senderoId)}</td>
                    <td className="px-3 py-3 text-right font-mono">{l.cupoDiario}</td>
                    <td className="px-3 py-3 text-right font-mono">{l.maxGrupo}</td>
                    <td className="px-3 py-3">
                      {l.ocupacionPct > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-bosque/8">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${l.ocupacionPct}%` }} transition={{ duration: 0.8 }} className={`h-2 rounded-full ${alerta ? 'bg-advertencia' : 'bg-[#3a8a5c]'}`} />
                          </div>
                          <span className="w-12 text-right font-mono text-sm">{l.ocupacionPct} %</span>
                          {alerta && <Insignia tono="alerta">Alerta</Insignia>}
                        </div>
                      ) : (
                        <span className="text-sm text-tinta-suave">Temporada aún sin reservas</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => setEditando(l.id)} aria-label={`Editar límite de ${nombreSendero(l.senderoId)}`} className="rounded-full px-4 py-2 text-sm font-bold text-pino underline-offset-4 hover:bg-arena hover:underline">
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Edicion
        limite={limites.find((l) => l.id === editando) ?? null}
        onCerrar={() => setEditando(null)}
        onGuardar={(nuevo) => {
          setLimites((ls) => ls.map((l) => (l.id === nuevo.id ? nuevo : l)));
          setEditando(null);
          avisar(`Límite de ${nombreSendero(nuevo.senderoId)} actualizado: ${nuevo.cupoDiario} por día`);
        }}
      />
    </div>
  );
}
