import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Frailin } from '@/features/asistente/Frailin';
import { Boton } from '@/ui/Boton';
import { CONVERSACIONES } from '../ejemplo';
import type { Conversacion } from '../ejemplo';
import { CabeceraPanel, Insignia, Pestanas, useAviso } from '../ui';

const IDIOMA = { es: 'Español', en: 'Inglés', fr: 'Francés', pt: 'Portugués' } as const;
type Filtro = 'abiertas' | 'resueltas';

/** Conversaciones del chat derivadas a una persona (RF-22). */
export function ConversacionesAdmin() {
  const { avisar } = useAviso();
  const [conversaciones, setConversaciones] = useState(CONVERSACIONES);
  const [filtro, setFiltro] = useState<Filtro>('abiertas');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState('');

  const visibles = conversaciones.filter((c) => (filtro === 'resueltas' ? c.estado === 'Resuelta' : c.estado !== 'Resuelta'));
  const actual = conversaciones.find((c) => c.id === abierta) ?? null;
  const actualizar = (c: Conversacion) => setConversaciones((cs) => cs.map((x) => (x.id === c.id ? c : x)));

  const responder = (e: FormEvent) => {
    e.preventDefault();
    if (!actual || !respuesta.trim()) return;
    actualizar({ ...actual, estado: 'En curso', mensajes: [...actual.mensajes, { de: 'equipo', texto: respuesta.trim(), hora: 'ahora' }] });
    setRespuesta('');
    avisar('Respuesta enviada al visitante');
  };

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Atención humana · derivadas desde Frailín" titulo="Conversaciones" fotoId="capilla-niebla">
        <dl className="m-0 flex gap-8">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">nuevas</dt>
            <dd className="m-0 font-cifras text-[28px] font-black text-lima">{conversaciones.filter((c) => c.estado === 'Nueva').length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">en curso</dt>
            <dd className="m-0 font-cifras text-[28px] font-black">{conversaciones.filter((c) => c.estado === 'En curso').length}</dd>
          </div>
        </dl>
      </CabeceraPanel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section aria-label="Bandeja" className={`flex flex-col gap-3 ${actual ? 'max-lg:hidden' : ''}`}>
          <Pestanas
            etiqueta="Bandeja"
            valor={filtro}
            onCambio={setFiltro}
            opciones={[
              { valor: 'abiertas' as Filtro, texto: 'Abiertas', cuenta: conversaciones.filter((c) => c.estado !== 'Resuelta').length },
              { valor: 'resueltas' as Filtro, texto: 'Resueltas', cuenta: conversaciones.filter((c) => c.estado === 'Resuelta').length },
            ]}
          />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {visibles.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={c.id === abierta}
                  onClick={() => setAbierta(c.id)}
                  className={`flex w-full flex-col gap-1.5 rounded-3xl border p-4 text-left transition-colors ${c.id === abierta ? 'border-bosque bg-superficie shadow-md' : 'border-transparent bg-superficie/70 hover:bg-superficie'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{c.visitante}</span>
                    <span className="flex-none text-xs text-tinta-suave">{c.hace}</span>
                  </span>
                  <span className="truncate text-sm text-tinta">{c.motivo}</span>
                  <span className="flex gap-1.5">
                    <Insignia tono={c.estado === 'Nueva' ? 'lima' : c.estado === 'En curso' ? 'info' : 'neutro'}>{c.estado}</Insignia>
                    <Insignia tono="neutro">{IDIOMA[c.idioma]}</Insignia>
                  </span>
                </button>
              </li>
            ))}
            {visibles.length === 0 && <li className="p-6 text-center text-sm text-tinta-suave">No hay conversaciones aquí.</li>}
          </ul>
        </section>

        <section aria-label="Conversación" className={`tarjeta flex min-h-[520px] flex-col overflow-hidden ${actual ? '' : 'max-lg:hidden'}`}>
          {actual ? (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b linea px-5 py-4">
                <button type="button" onClick={() => setAbierta(null)} className="rounded-full px-2 py-1 text-sm font-bold text-pino lg:hidden">
                  ← Bandeja
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-display text-lg font-bold">{actual.visitante}</span>
                  <span className="text-sm text-tinta-suave">
                    {actual.motivo} · escribe en {IDIOMA[actual.idioma].toLowerCase()}
                  </span>
                </div>
                {actual.estado !== 'Resuelta' && (
                  <Boton
                    variante="secundario"
                    className="h-10 px-4 text-sm"
                    onClick={() => {
                      actualizar({ ...actual, estado: 'Resuelta' });
                      avisar('Conversación marcada como resuelta');
                    }}
                  >
                    Marcar resuelta
                  </Boton>
                )}
              </header>
              <ul role="log" aria-label="Mensajes" className="m-0 flex flex-1 list-none flex-col gap-3 overflow-y-auto bg-arena/50 p-5">
                <AnimatePresence initial={false}>
                  {actual.mensajes.map((m, i) => (
                    <motion.li key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${m.de === 'visitante' ? 'justify-start' : 'justify-end'}`}>
                      {m.de === 'visitante' && (
                        <span aria-hidden="true" className="flex size-8 flex-none items-center justify-center rounded-full bg-arena-oscura text-sm font-bold">
                          {actual.visitante[0]}
                        </span>
                      )}
                      <div className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-[15px] ${m.de === 'visitante' ? 'rounded-bl-md bg-superficie' : m.de === 'frailin' ? 'rounded-br-md bg-lima/40' : 'rounded-br-md bg-bosque text-white'}`}>
                        <span className="block text-[11px] font-bold tracking-wide uppercase opacity-60">{m.de === 'visitante' ? 'Visitante' : m.de === 'frailin' ? 'Frailín' : 'Equipo'}</span>
                        {m.texto}
                        <span className="mt-1 block text-right text-[11px] opacity-60">{m.hora}</span>
                      </div>
                      {m.de === 'frailin' && (
                        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-bosque">
                          <Frailin tamano={26} animado={false} />
                        </span>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {actual.estado !== 'Resuelta' && (
                <form onSubmit={responder} className="flex items-end gap-2 border-t linea p-3">
                  <label htmlFor="respuesta-equipo" className="sr-only">
                    Respuesta
                  </label>
                  <textarea
                    id="respuesta-equipo"
                    rows={2}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder={`Responder en ${IDIOMA[actual.idioma].toLowerCase()}…`}
                    className="min-h-12 flex-1 resize-none rounded-3xl border border-bosque/15 bg-arena px-4 py-3 text-[15px] focus:border-bosque focus:outline-none"
                  />
                  <Boton type="submit" className="h-12 px-6 text-sm" disabled={!respuesta.trim()}>
                    Enviar
                  </Boton>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-tinta-suave">
              <Frailin tamano={64} />
              <span>Elige una conversación de la bandeja.</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
