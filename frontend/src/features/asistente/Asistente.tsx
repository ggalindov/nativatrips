import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useIdioma } from '@/i18n/IdiomaContext';
import { CURVA } from '@/ui/movimiento';
import { Frailin } from './Frailin';

interface Mensaje {
  id: number;
  rol: 'visitante' | 'frailin';
  texto: string;
}

const CLAVE_CONVERSACION = 'nativatrips.frailin';
const CLAVE_INVITACION = 'nativatrips.frailin-invitado';
const MAX_CARACTERES = 4000;

function leerConversacion(): Mensaje[] {
  try {
    const crudo = sessionStorage.getItem(CLAVE_CONVERSACION);
    return crudo ? (JSON.parse(crudo) as Mensaje[]) : [];
  } catch {
    return [];
  }
}

/** Negritas con **texto** y saltos de línea, sin interpretar HTML. */
function TextoConFormato({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linea, i) => (
        <span key={i} className="block">
          {linea.split(/(\*\*[^*]+\*\*)/g).map((parte, j): ReactNode =>
            parte.startsWith('**') && parte.endsWith('**') ? <strong key={j}>{parte.slice(2, -2)}</strong> : parte,
          )}
        </span>
      ))}
    </>
  );
}

function Burbuja({ rol, children }: { rol: Mensaje['rol']; children: ReactNode }) {
  const propio = rol === 'visitante';
  return (
    <motion.li
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: CURVA }}
      className={`flex items-end gap-2 ${propio ? 'justify-end' : 'justify-start'}`}
    >
      {!propio && (
        <span className="mb-0.5 flex size-8 flex-none items-center justify-center rounded-full bg-bosque">
          <Frailin tamano={26} animado={false} />
        </span>
      )}
      <div
        className={`max-w-[82%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed ${
          propio ? 'rounded-br-md bg-bosque text-white' : 'rounded-bl-md bg-superficie text-bosque shadow-[var(--shadow-tarjeta)]'
        }`}
      >
        {children}
      </div>
    </motion.li>
  );
}

function Escribiendo({ etiqueta }: { etiqueta: string }) {
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2" role="status" aria-label={etiqueta}>
      <span className="flex size-8 flex-none items-center justify-center rounded-full bg-bosque">
        <Frailin tamano={26} animado={false} />
      </span>
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-superficie px-4 py-3.5 shadow-[var(--shadow-tarjeta)]">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="size-2 rounded-full bg-pino" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </motion.li>
  );
}

/**
 * Frailín, el asistente del sitio (RF-19). Por ahora es solo la interfaz:
 * responde con un mensaje de demostración y ofrece hablar con una persona
 * (RF-22). La conexión con el asistente del servidor queda para después.
 */
export function Asistente() {
  const { t } = useIdioma();
  const c = t.chat;
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(leerConversacion);
  const [texto, setTexto] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);
  const [invitacion, setInvitacion] = useState(false);
  const lanzador = useRef<HTMLButtonElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);
  const fin = useRef<HTMLDivElement>(null);

  // En la ficha de un sendero hay una barra fija abajo: el lanzador sube para no taparla.
  const conBarraInferior = /^\/senderos\/[^/]+$/.test(pathname);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_CONVERSACION, JSON.stringify(mensajes));
    } catch {
      /* sin almacenamiento: la conversación dura mientras la página esté abierta */
    }
  }, [mensajes]);

  // Invitación una vez por sesión, a los pocos segundos de llegar.
  useEffect(() => {
    let vista = false;
    try {
      vista = sessionStorage.getItem(CLAVE_INVITACION) === '1';
    } catch {
      /* sin almacenamiento: se muestra igual */
    }
    if (vista) return;
    const temporizador = setTimeout(() => setInvitacion(true), 6000);
    return () => clearTimeout(temporizador);
  }, []);

  const cerrarInvitacion = () => {
    setInvitacion(false);
    try {
      sessionStorage.setItem(CLAVE_INVITACION, '1');
    } catch {
      /* nada que guardar */
    }
  };

  useEffect(() => {
    if (!abierto) return;
    cerrarInvitacion();
    entrada.current?.focus();
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        lanzador.current?.focus();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto]);

  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  }, [mensajes, escribiendo, abierto]);

  const enviar = (contenido: string) => {
    const limpio = contenido.trim().slice(0, MAX_CARACTERES);
    if (!limpio || escribiendo) return;
    setMensajes((m) => [...m, { id: Date.now(), rol: 'visitante', texto: limpio }]);
    setTexto('');
    setEscribiendo(true);
    setTimeout(() => {
      setMensajes((m) => [...m, { id: Date.now() + 1, rol: 'frailin', texto: c.demo }]);
      setEscribiendo(false);
    }, 1100);
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    enviar(texto);
  };

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(texto);
    }
  };

  const respondio = mensajes.some((m) => m.rol === 'frailin');

  return (
    <>
      <AnimatePresence>
        {invitacion && !abierto && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.35, ease: CURVA }}
            className={`fixed right-4 z-30 flex max-w-[260px] items-start gap-2 rounded-3xl rounded-br-md bg-superficie p-4 pr-3 text-sm text-bosque shadow-2xl sm:right-6 ${conBarraInferior ? 'bottom-[10.5rem]' : 'bottom-24'}`}
          >
            <button type="button" onClick={() => setAbierto(true)} className="text-left leading-snug">
              {c.invitacion}
            </button>
            <button type="button" onClick={cerrarInvitacion} aria-label={c.cerrarInvitacion} className="-mt-1 flex size-7 flex-none items-center justify-center rounded-full text-tinta-suave hover:bg-arena">
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={lanzador}
        type="button"
        aria-label={abierto ? c.cerrar : c.abrir}
        aria-expanded={abierto}
        aria-controls="chat-frailin"
        onClick={() => setAbierto((a) => !a)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 1.2 }}
        className={`fixed right-4 z-30 flex size-16 items-center justify-center rounded-full bg-lima shadow-[0_14px_40px_-10px_rgb(19_32_26/0.55)] sm:right-6 ${conBarraInferior ? 'bottom-24' : 'bottom-5'} ${abierto ? 'max-sm:hidden' : ''}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {abierto ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--color-bosque)" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </motion.svg>
          ) : (
            <motion.span key="f" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <Frailin tamano={54} />
            </motion.span>
          )}
        </AnimatePresence>
        {!abierto && <span aria-hidden="true" className="absolute top-1 right-1 size-3.5 rounded-full border-2 border-lima bg-ecosistema" />}
      </motion.button>

      <AnimatePresence>
        {abierto && (
          <motion.section
            id="chat-frailin"
            role="dialog"
            aria-label={c.conversacion}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: CURVA }}
            className={`fixed inset-0 z-[60] flex flex-col overflow-hidden bg-arena sm:inset-auto sm:right-6 sm:h-[min(640px,calc(100svh-9rem))] sm:w-[400px] sm:rounded-[28px] sm:shadow-[0_30px_80px_-20px_rgb(19_32_26/0.55)] ${conBarraInferior ? 'sm:bottom-44' : 'sm:bottom-24'}`}
          >
            <header className="relative flex items-center gap-3 bg-bosque px-4 py-3.5 text-white">
              <span className="flex size-12 flex-none items-center justify-center rounded-full bg-bosque-2 ring-2 ring-lima/40">
                <Frailin tamano={40} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-lg leading-tight font-extrabold">{c.nombre}</span>
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span aria-hidden="true" className="size-2 rounded-full bg-lima" />
                  {c.rol} · {c.estado}
                </span>
              </div>
              {mensajes.length > 0 && (
                <button type="button" onClick={() => setMensajes([])} aria-label={c.reiniciar} title={c.reiniciar} className="flex size-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  lanzador.current?.focus();
                }}
                aria-label={c.cerrar}
                className="flex size-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
              <ul role="log" aria-live="polite" aria-label={c.conversacion} className="m-0 flex list-none flex-col gap-3 p-0">
                <Burbuja rol="frailin">
                  <TextoConFormato texto={c.bienvenida} />
                </Burbuja>
                {mensajes.map((m) => (
                  <Burbuja key={m.id} rol={m.rol}>
                    <TextoConFormato texto={m.texto} />
                  </Burbuja>
                ))}
                <AnimatePresence>{escribiendo && <Escribiendo etiqueta={c.escribiendo} />}</AnimatePresence>
              </ul>

              {mensajes.length === 0 && (
                <div role="group" aria-label={c.sugerenciasAria} className="mt-4 flex flex-wrap gap-2 pl-10">
                  {c.sugerencias.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.07 }}
                      onClick={() => enviar(s)}
                      className="rounded-full border border-bosque/15 bg-superficie px-3.5 py-2 text-left text-sm font-semibold text-bosque transition-colors hover:border-bosque hover:bg-bosque hover:text-lima"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}

              {respondio && !escribiendo && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 ml-10 flex flex-col gap-1.5 rounded-3xl border border-dashed border-bosque/25 p-4 text-sm">
                  <span className="font-display font-bold">{c.humanoTitulo}</span>
                  <span className="text-tinta">{c.humanoTexto}</span>
                  <span className="font-mono text-xs text-tinta-suave">{c.humanoContacto}</span>
                </motion.div>
              )}
              <div ref={fin} />
            </div>

            <form onSubmit={alEnviar} className="flex flex-col gap-2 border-t linea bg-superficie px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2">
                <label htmlFor="chat-frailin-texto" className="sr-only">
                  {c.placeholder}
                </label>
                <textarea
                  id="chat-frailin-texto"
                  ref={entrada}
                  rows={1}
                  value={texto}
                  maxLength={MAX_CARACTERES}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={alTeclear}
                  placeholder={c.placeholder}
                  className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-bosque/15 bg-arena px-4 py-3 text-[15px] leading-snug text-bosque [field-sizing:content] placeholder:text-tinta-suave focus:border-bosque focus:outline-none"
                />
                <motion.button
                  type="submit"
                  aria-label={c.enviar}
                  disabled={!texto.trim() || escribiendo}
                  whileTap={{ scale: 0.92 }}
                  className="flex size-12 flex-none items-center justify-center rounded-full bg-lima text-bosque transition-opacity disabled:opacity-40"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </motion.button>
              </div>
              <span className="px-2 text-center text-[11px] text-tinta-suave">{c.aviso}</span>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
