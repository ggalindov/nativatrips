import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useIdioma } from '@/i18n/IdiomaContext';
import { CURVA } from './movimiento';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: string;
}

/**
 * Diálogo modal sobre <dialog>: foco atrapado y tecla Escape del navegador,
 * con entrada animada.
 */
export function Dialogo({ abierto, onCerrar, titulo, children, ancho = 'max-w-3xl' }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useIdioma();

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
      className={`m-auto w-[calc(100%-2rem)] ${ancho} overflow-visible bg-transparent p-0 backdrop:bg-bosque/70 backdrop:backdrop-blur-sm`}
    >
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: CURVA }}
            className="relative overflow-hidden rounded-[32px] bg-superficie shadow-2xl"
          >
            <button
              type="button"
              onClick={onCerrar}
              aria-label={t.comun.cerrar}
              className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/90 text-bosque shadow-md transition-transform hover:rotate-90"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
