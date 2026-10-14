import { useMemo, useState } from 'react';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { EnlaceBoton } from '@/ui/Boton';
import { MiniaturaMedio } from './MiniaturaMedio';
import { Visor } from './Visor';

/** Segundos que tarda cada foto en cruzar: define la velocidad de la franja. */
const SEGUNDOS_POR_FOTO = 26;

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

function Tarjeta({ medio, onAbrir, oculta = false }: { medio: ElementoBiblioteca; onAbrir?: () => void; oculta?: boolean }) {
  const { t } = useIdioma();
  const { altMedio } = useContenido();
  return (
    <li className="w-[72vw] flex-none pr-4 sm:w-[42vw] lg:w-[28vw] xl:w-[27rem]">
      <button
        type="button"
        onClick={onAbrir}
        tabIndex={oculta ? -1 : undefined}
        aria-label={t.biblioteca.ampliar(altMedio(medio))}
        className="group relative block h-[52vh] max-h-[520px] min-h-[320px] w-full overflow-hidden rounded-[32px] text-left"
      >
        <MiniaturaMedio medio={medio} className="transition-transform duration-[1.4s] group-hover:scale-110" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-bosque/90 via-bosque/30 to-transparent p-6 pt-16 text-white">
          <span className="etiqueta text-lima">{t.biblioteca.categorias[medio.categoria]}</span>
          <span className="font-display text-xl font-bold">{altMedio(medio)}</span>
        </span>
      </button>
    </li>
  );
}

/**
 * Carrusel de la portada alimentado por la biblioteca: franja en movimiento
 * continuo, con las fotos en orden aleatorio en cada visita. Se detiene al
 * pasar el mouse o al enfocar una foto, y al tocarla se abre el visor.
 */
export function Carrusel({ limite = 14 }: { limite?: number }) {
  const { biblioteca } = useServicios();
  const { t } = useIdioma();
  const { estado } = useConsulta(() => biblioteca.listar(), [biblioteca]);
  const [semilla] = useState(() => Math.random());
  const [abierto, setAbierto] = useState<number | null>(null);
  const medios = useMemo(() => (estado.tipo === 'listo' ? mezclar(estado.datos, semilla).slice(0, limite) : []), [estado, semilla, limite]);

  if (medios.length === 0) return null;

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-max animate-[desfile_linear_infinite] [backface-visibility:hidden] will-change-transform hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] ${abierto !== null ? '[animation-play-state:paused]' : ''}`}
        style={{ animationDuration: `${medios.length * SEGUNDOS_POR_FOTO}s` }}
      >
        <ul aria-label={t.biblioteca.carrusel} className="m-0 flex list-none p-0 pl-4">
          {medios.map((m, i) => (
            <Tarjeta key={m.id} medio={m} onAbrir={() => setAbierto(i)} />
          ))}
        </ul>
        {/* Copia para que la franja se repita sin corte; los lectores de pantalla la ignoran. */}
        <ul aria-hidden="true" className="m-0 flex list-none p-0 pl-4">
          {medios.map((m) => (
            <Tarjeta key={m.id} medio={m} oculta />
          ))}
        </ul>
      </div>
      <div className="mt-8 flex justify-center px-4">
        <EnlaceBoton to="/biblioteca" variante="oscuro" conFlecha>
          {t.biblioteca.verBiblioteca}
        </EnlaceBoton>
      </div>
      <Visor medios={medios} indice={abierto} onCambiar={setAbierto} />
    </div>
  );
}
