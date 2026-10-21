import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { CategoriaMedio } from '@/domain/biblioteca';
import { CATEGORIAS_MEDIO, contarPorCategoria, filtrarPorCategoria } from '@/domain/biblioteca';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, CURVA } from '@/ui/movimiento';
import { MiniaturaMedio } from './MiniaturaMedio';
import { Visor } from './Visor';

/** Biblioteca de fotos y videos del páramo, en mosaico con filtros y visor. */
export function BibliotecaPage() {
  const { biblioteca } = useServicios();
  const { t } = useIdioma();
  const { altMedio } = useContenido();
  const b = t.biblioteca;
  const { estado, recargar } = useConsulta(() => biblioteca.listar(), [biblioteca]);
  const [categoria, setCategoria] = useState<CategoriaMedio | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);

  const todos = useMemo(() => (estado.tipo === 'listo' ? estado.datos : []), [estado]);
  const visibles = useMemo(() => filtrarPorCategoria(todos, categoria), [todos, categoria]);
  const cuenta = useMemo(() => contarPorCategoria(todos), [todos]);
  const propios = todos.filter((m) => m.propio).length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-32 pb-24 sm:px-8 lg:px-12">
      <Aparecer className="grid grid-cols-[minmax(0,1fr)] items-end gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="etiqueta text-tinta-suave">{b.etiqueta}</span>
          <h1 className="m-0 font-display text-5xl leading-[0.95] font-extrabold tracking-tight md:text-7xl">{b.titulo}</h1>
        </div>
        <p className="m-0 text-[17px] leading-relaxed text-tinta">
          {b.texto} {propios > 0 ? b.propios(propios) : b.libres}
        </p>
      </Aparecer>

      <div role="group" aria-label={b.filtrar} className="flex flex-wrap gap-2">
        {[null, ...CATEGORIAS_MEDIO].map((c) => {
          const activo = categoria === c;
          const n = c === null ? todos.length : cuenta[c];
          return (
            <button
              key={c ?? 'todo'}
              type="button"
              aria-pressed={activo}
              onClick={() => setCategoria(c)}
              disabled={n === 0}
              className={`relative flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-40 ${activo ? 'text-lima' : 'bg-superficie text-bosque hover:bg-bosque/5'}`}
            >
              {activo && <motion.span layoutId="biblioteca-filtro" className="absolute inset-0 rounded-full bg-bosque" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{c ? b.categorias[c] : b.todo}</span>
              <span className={`relative rounded-full px-2 text-xs ${activo ? 'bg-lima/20' : 'bg-arena'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {estado.tipo === 'cargando' && <Cargando texto={b.cargando} />}
      {estado.tipo === 'error' && <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />}
      {estado.tipo === 'listo' && (
        <ul aria-label={b.lista} className="m-0 list-none columns-2 gap-3 p-0 sm:gap-4 lg:columns-3 [&>li]:mb-3 sm:[&>li]:mb-4">
          {visibles.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: CURVA, delay: Math.min(i, 12) * 0.04 }}
              className="break-inside-avoid"
            >
              <button
                type="button"
                onClick={() => setAbierto(i)}
                aria-label={b.ampliar(altMedio(m))}
                className="group relative block w-full overflow-hidden rounded-[18px] bg-arena-oscura sm:rounded-[24px] text-left shadow-[var(--shadow-tarjeta)]"
                style={{ aspectRatio: `${m.ancho} / ${m.alto}` }}
              >
                <MiniaturaMedio medio={m} className="transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-0.5 bg-gradient-to-t from-bosque/85 to-transparent p-3 pt-10 text-white sm:p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  <span className="line-clamp-2 font-display text-sm font-bold sm:text-base">{altMedio(m)}</span>
                  <span className="truncate text-xs text-white/70">
                    {b.categorias[m.categoria]} · {m.propio ? 'Eco Palacio Tur' : m.credito}
                  </span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}

      <Visor medios={visibles} indice={abierto} onCambiar={setAbierto} />
    </div>
  );
}
