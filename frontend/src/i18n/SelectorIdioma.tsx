import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CURVA } from '@/ui/movimiento';
import { useIdioma } from './IdiomaContext';
import { IDIOMAS } from './idiomas';

function Globo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </svg>
  );
}

interface Props {
  /** "barra": cápsula compacta sobre fondo oscuro. "lista": opciones a la vista (menú móvil y pie). */
  variante?: 'barra' | 'lista';
}

/**
 * Selector de idioma. En la barra es un menú desplegable accesible (Escape
 * lo cierra y devuelve el foco); en el menú móvil y el pie, botones directos.
 */
export function SelectorIdioma({ variante = 'barra' }: Props) {
  const { idioma, cambiar, t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  if (variante === 'lista') {
    return (
      <div role="group" aria-label={t.comun.idioma} className="flex flex-wrap gap-2">
        {IDIOMAS.map((i) => (
          <button
            key={i.codigo}
            type="button"
            lang={i.codigo}
            aria-pressed={idioma === i.codigo}
            onClick={() => cambiar(i.codigo)}
            className={`flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
              idioma === i.codigo ? 'border-lima bg-lima text-bosque' : 'border-white/20 text-white/80 hover:border-white/50 hover:text-white'
            }`}
          >
            <span className="font-mono text-[11px] uppercase">{i.codigo}</span>
            {i.nombre}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={raiz} className="relative">
      <button
        ref={boton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-label={`${t.comun.cambiarIdioma}: ${IDIOMAS.find((i) => i.codigo === idioma)?.nombre}`}
        onClick={() => setAbierto((a) => !a)}
        className="flex h-11 items-center gap-1.5 rounded-full bg-white/10 px-3 text-white transition-colors hover:bg-white/20"
      >
        <Globo />
        <span className="font-mono text-xs font-bold uppercase">{idioma}</span>
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.ul
            id={idLista}
            role="listbox"
            aria-label={t.comun.idioma}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: CURVA }}
            className="absolute top-[calc(100%+10px)] right-0 z-50 m-0 flex w-48 origin-top-right list-none flex-col gap-0.5 rounded-3xl border border-white/10 bg-bosque/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            {IDIOMAS.map((i) => {
              const activo = idioma === i.codigo;
              return (
                <li key={i.codigo} role="option" aria-selected={activo}>
                  <button
                    type="button"
                    lang={i.codigo}
                    autoFocus={activo}
                    onClick={() => {
                      cambiar(i.codigo);
                      setAbierto(false);
                      boton.current?.focus();
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                      activo ? 'bg-lima font-bold text-bosque' : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {i.nombre}
                    <span className={`font-mono text-[11px] uppercase ${activo ? 'text-bosque/70' : 'text-white/40'}`}>{i.codigo}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
