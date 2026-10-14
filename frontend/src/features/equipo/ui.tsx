import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { IdFoto } from '@/contenido/fotos';
import { foto } from '@/contenido/fotos';
import { esExtranjero } from '@/domain/paises';
import type { EstadoReserva } from '@/domain/reserva';
import { es } from '@/i18n/diccionarios/es';
import { CURVA, FotoAnimada } from '@/ui/movimiento';

/** Cabecera con foto de cada pantalla del equipo. */
export function CabeceraPanel({ etiqueta, titulo, fotoId, children }: { etiqueta: string; titulo: string; fotoId: IdFoto; children?: ReactNode }) {
  return (
    <div className="relative isolate flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-[32px] bg-bosque p-6 text-white sm:p-8 md:p-10">
      <div className="absolute inset-0 -z-10">
        <FotoAnimada src={foto(fotoId).src} alt="" kenBurns prioridad />
        <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/75 to-bosque/30" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="etiqueta text-lima">{etiqueta}</span>
        <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight sm:text-[44px]">{titulo}</h1>
      </div>
      {children}
    </div>
  );
}

export function TituloSeccion({ id, children, nota, accion }: { id: string; children: ReactNode; nota?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id={id} className="m-0 font-display text-2xl font-bold">
          {children}
        </h2>
        {nota && <span className="text-sm text-tinta-suave">{nota}</span>}
      </div>
      {accion && <div className="max-w-full min-w-0">{accion}</div>}
    </div>
  );
}

export type Tono = 'neutro' | 'exito' | 'alerta' | 'peligro' | 'info' | 'lima';

const TONOS: Record<Tono, string> = {
  neutro: 'bg-arena-oscura text-tinta',
  exito: 'bg-[#3a8a5c]/12 text-[#25633f]',
  alerta: 'bg-advertencia/10 text-advertencia',
  peligro: 'bg-error/10 text-error',
  info: 'bg-bosque/8 text-bosque',
  lima: 'bg-lima text-bosque',
};

/** Insignia de estado: siempre lleva texto, nunca solo color. */
export function Insignia({ tono = 'neutro', children, icono }: { tono?: Tono; children: ReactNode; icono?: ReactNode }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold whitespace-nowrap ${TONOS[tono]}`}>
      {icono}
      {children}
    </span>
  );
}

const TONO_ESTADO: Record<EstadoReserva, Tono> = {
  PENDIENTE_PAGO: 'alerta',
  EN_REVISION: 'info',
  CONFIRMADA: 'exito',
  CANCELADA: 'peligro',
  EXPIRADA: 'neutro',
  COMPLETADA: 'neutro',
};

export function InsigniaEstado({ estado }: { estado: EstadoReserva }) {
  return (
    <Insignia tono={TONO_ESTADO[estado]} icono={<span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}>
      {es.estados[estado]}
    </Insignia>
  );
}

const nombresPais = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;

export function nombrePais(codigo: string): string {
  return codigo === 'OTROS' ? 'Otros países' : (nombresPais?.of(codigo) ?? codigo);
}

/** Código del país en una etiqueta: se ve igual en todos los sistemas (Windows no muestra banderas emoji). */
export function Pais({ codigo, conNombre = false }: { codigo: string; conNombre?: boolean }) {
  const extranjero = esExtranjero(codigo);
  return (
    <span className="inline-flex items-center gap-1.5" title={nombrePais(codigo)}>
      <span
        className={`inline-flex h-5 min-w-7 items-center justify-center rounded-md px-1 font-mono text-[10px] font-bold ${extranjero ? 'bg-[#c2410c]/12 text-[#9a3412]' : 'bg-bosque/8 text-bosque'}`}
        aria-label={nombrePais(codigo)}
      >
        {codigo}
      </span>
      {conNombre && <span className="text-sm">{nombrePais(codigo)}</span>}
    </span>
  );
}

export function Indicador({ titulo, valor, nota, tendencia }: { titulo: string; valor: string; nota?: string; tendencia?: { texto: string; positiva: boolean } }) {
  return (
    <div className="tarjeta flex min-w-0 flex-col gap-1 p-5">
      <span className="text-sm text-tinta-suave">{titulo}</span>
      <span className="font-cifras text-[28px] leading-tight font-black whitespace-nowrap">{valor}</span>
      <span className="flex flex-wrap items-center gap-2 text-[13px] text-tinta-suave">
        {tendencia && (
          <span className={`inline-flex items-center gap-1 font-bold ${tendencia.positiva ? 'text-[#25633f]' : 'text-advertencia'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d={tendencia.positiva ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
            </svg>
            {tendencia.texto}
          </span>
        )}
        {nota}
      </span>
    </div>
  );
}

export function Pestanas<T extends string>({ opciones, valor, onCambio, etiqueta }: { opciones: readonly { valor: T; texto: string; cuenta?: number }[]; valor: T; onCambio: (v: T) => void; etiqueta: string }) {
  return (
    <div role="tablist" aria-label={etiqueta} className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-superficie p-1 shadow-sm [scrollbar-width:none]">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="tab"
            aria-selected={activa}
            onClick={() => onCambio(o.valor)}
            className={`relative flex h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors ${activa ? 'text-lima' : 'text-tinta hover:text-bosque'}`}
          >
            {activa && <motion.span layoutId={`pestana-${etiqueta}`} className="absolute inset-0 rounded-full bg-bosque" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{o.texto}</span>
            {o.cuenta !== undefined && <span className={`relative rounded-full px-1.5 text-xs ${activa ? 'bg-lima/20' : 'bg-arena'}`}>{o.cuenta}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Cajón lateral para el detalle de un registro (pantalla completa en celular). */
export function Cajon({ abierto, onCerrar, titulo, subtitulo, children, pie }: { abierto: boolean; onCerrar: () => void; titulo: string; subtitulo?: string; children: ReactNode; pie?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Respaldo para entornos sin showModal (pruebas, navegadores antiguos).
    if (abierto && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    }
    if (!abierto && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [abierto]);
  return (
    <dialog
      ref={ref}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-0 ml-auto h-full max-h-none w-full max-w-[560px] overflow-visible bg-transparent p-0 backdrop:bg-bosque/60 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: CURVA }}
            className="flex h-full flex-col bg-arena shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b linea bg-superficie px-6 py-5">
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="m-0 font-display text-2xl font-extrabold">{titulo}</h2>
                {subtitulo && <span className="text-sm text-tinta-suave">{subtitulo}</span>}
              </div>
              <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex size-11 flex-none items-center justify-center rounded-full bg-arena text-bosque transition-transform hover:rotate-90">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {pie && <footer className="flex flex-wrap justify-end gap-2 border-t linea bg-superficie px-6 py-4">{pie}</footer>}
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

/** Lista de pares clave-valor para fichas de detalle. */
export function Datos({ filas }: { filas: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
      {filas.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <dt className="etiqueta text-[11px] text-tinta-suave">{k}</dt>
          <dd className="m-0 font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

interface AvisoContexto {
  avisar: (texto: string) => void;
}

const ContextoAviso = createContext<AvisoContexto>({ avisar: () => undefined });

/** Avisos breves al pie de la pantalla ("Guardado", "Exportando…"). */
export function AvisoProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<{ id: number; texto: string }[]>([]);
  const avisar = useCallback((texto: string) => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a.slice(-2), { id, texto }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ContextoAviso.Provider value={{ avisar }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {avisos.map((a) => (
            <motion.div
              key={a.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-bosque px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            >
              <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-lima text-[11px] font-black text-bosque">✓</span>
              {a.texto}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ContextoAviso.Provider>
  );
}

export function useAviso() {
  return useContext(ContextoAviso);
}

/** Campo de búsqueda compacto para tablas. */
export function Busqueda({ valor, onCambio, etiqueta, placeholder }: { valor: string; onCambio: (v: string) => void; etiqueta: string; placeholder: string }) {
  return (
    <label className="relative w-full min-w-0 sm:w-auto sm:min-w-[240px] sm:flex-1">
      <span className="sr-only">{etiqueta}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-bosque/15 bg-superficie pr-4 pl-10 text-[15px] focus:border-bosque focus:outline-none"
      />
    </label>
  );
}

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatoPesos = (v: number) => pesos.format(v).replace(/\s/g, ' ');
const fechas = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
export const formatoFecha = (iso: string) => fechas.format(new Date(`${iso}T12:00:00`));
