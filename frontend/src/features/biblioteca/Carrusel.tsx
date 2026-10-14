import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { EnlaceBoton } from '@/ui/Boton';
import { CURVA } from '@/ui/movimiento';
import { MiniaturaMedio } from './MiniaturaMedio';
import { Visor } from './Visor';

/** Mezcla Fisher-Yates con una semilla fija por visita, para que el orden no cambie en cada render. */
function mezclar<T>(lista: readonly T[], semilla: number): T[] {
  const copia = [...lista];
  let h = Math.floor(semilla * 2 ** 31) || 1;
  for (let i = copia.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Posición de cada foto en el mosaico de escritorio: una grande y cuatro pequeñas. */
const CELDAS = ['lg:col-span-2 lg:row-span-2', '', '', '', ''];

/**
 * Galería de la portada alimentada por la biblioteca, sin movimiento
 * automático: mosaico en escritorio y fila que se desliza con el dedo en
 * celular. Las fotos salen en orden aleatorio en cada visita; al tocar una se
 * abre el visor.
 */
export function Carrusel({ limite = 5 }: { limite?: number }) {
  const { biblioteca } = useServicios();
  const { t } = useIdioma();
  const { altMedio } = useContenido();
  const { estado } = useConsulta(() => biblioteca.listar(), [biblioteca]);
  const [semilla] = useState(() => Math.random());
  const [abierto, setAbierto] = useState<number | null>(null);
  const medios: ElementoBiblioteca[] = useMemo(() => (estado.tipo === 'listo' ? mezclar(estado.datos, semilla).slice(0, limite) : []), [estado, semilla, limite]);

  if (medios.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <ul
        aria-label={t.biblioteca.carrusel}
        className="m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 px-4 [scrollbar-width:none] sm:px-8 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-4 lg:grid-rows-[220px_220px] lg:gap-4 lg:overflow-visible lg:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {medios.map((m, i) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: CURVA, delay: i * 0.07 }}
            className={`w-[78vw] flex-none snap-start sm:w-[46vw] lg:w-auto ${CELDAS[i] ?? ''}`}
          >
            <button
              type="button"
              onClick={() => setAbierto(i)}
              aria-label={t.biblioteca.ampliar(altMedio(m))}
              className="group relative block h-[360px] w-full overflow-hidden rounded-[28px] text-left lg:h-full"
            >
              <MiniaturaMedio medio={m} className="transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-bosque/90 via-bosque/30 to-transparent p-5 pt-14 text-white">
                <span className="etiqueta text-lima">{t.biblioteca.categorias[m.categoria]}</span>
                <span className={`font-display font-bold ${i === 0 ? 'text-2xl' : 'text-lg'}`}>{altMedio(m)}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      <div className="flex justify-center px-4">
        <EnlaceBoton to="/biblioteca" variante="oscuro" conFlecha>
          {t.biblioteca.verBiblioteca}
        </EnlaceBoton>
      </div>
      <Visor medios={medios} indice={abierto} onCambiar={setAbierto} />
    </div>
  );
}
