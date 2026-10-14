import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import { indiceCircular } from '@/domain/biblioteca';
import { Dialogo } from '@/ui/Dialogo';
import { CURVA } from '@/ui/movimiento';

interface Props {
  medios: readonly ElementoBiblioteca[];
  indice: number | null;
  onCambiar: (indice: number | null) => void;
}

/** Visor a pantalla amplia: flechas, teclado (← →) y gesto de deslizar. */
export function Visor({ medios, indice, onCambiar }: Props) {
  const total = medios.length;
  const m = indice === null ? null : medios[indice];
  const mover = (paso: number) => indice !== null && onCambiar(indiceCircular(indice, paso, total));

  useEffect(() => {
    if (indice === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onCambiar(indiceCircular(indice, 1, total));
      if (e.key === 'ArrowLeft') onCambiar(indiceCircular(indice, -1, total));
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [indice, total, onCambiar]);

  return (
    <Dialogo abierto={m !== null} onCerrar={() => onCambiar(null)} titulo={m?.alt ?? 'Visor'} ancho="max-w-6xl">
      {m && (
        <div className="bg-bosque">
          <div className="relative flex min-h-[40vh] items-center justify-center overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.45, ease: CURVA }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80) mover(1);
                  if (info.offset.x > 80) mover(-1);
                }}
                className="w-full"
              >
                {m.tipo === 'video' ? (
                  <video src={m.src} poster={m.miniatura} controls autoPlay muted loop playsInline className="max-h-[78vh] w-full object-contain" />
                ) : (
                  <img src={m.src} alt={m.alt} className="max-h-[78vh] w-full object-contain select-none" draggable={false} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-4 p-4 text-white">
            <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-lima hover:text-bosque">
              ←
            </button>
            <div className="flex min-w-0 flex-col items-center text-center">
              <span className="truncate font-display font-bold">{m.alt}</span>
              <span className="text-xs text-white/60">
                {m.propio ? 'Eco Palacio Tur' : `${m.credito} · ${m.licencia}`} · {indice! + 1} de {total}
              </span>
            </div>
            <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-lima hover:text-bosque">
              →
            </button>
          </div>
        </div>
      )}
    </Dialogo>
  );
}
