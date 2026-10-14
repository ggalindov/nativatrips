import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'motion/react';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import { indiceCircular } from '@/domain/biblioteca';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { FlechaAccion } from '@/ui/Boton';
import { MiniaturaMedio } from './MiniaturaMedio';
import { Visor } from './Visor';

const AVANCE_MS = 4500;

/**
 * Carrusel alimentado por la biblioteca: desplazamiento nativo con imán,
 * flechas, avance automático (se detiene al pasar el mouse, al enfocarlo y
 * con movimiento reducido) y visor al tocar una foto.
 */
export function Carrusel({ limite = 14 }: { limite?: number }) {
  const { biblioteca } = useServicios();
  const { estado } = useConsulta(() => biblioteca.listar(), [biblioteca]);
  const pista = useRef<HTMLUListElement>(null);
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [abierto, setAbierto] = useState<number | null>(null);
  const reducido = useReducedMotion();
  const medios: ElementoBiblioteca[] = estado.tipo === 'listo' ? estado.datos.slice(0, limite) : [];

  const irA = useCallback((i: number) => {
    const el = pista.current?.children[i] as HTMLElement | undefined;
    if (!el || !pista.current) return;
    pista.current.scrollTo({ left: el.offsetLeft - pista.current.offsetLeft, behavior: 'smooth' });
  }, []);

  // El índice actual sale de la posición real del scroll (sirve también al arrastrar).
  const alDesplazar = () => {
    const p = pista.current;
    if (!p) return;
    const hijos = Array.from(p.children) as HTMLElement[];
    let mejor = 0;
    hijos.forEach((h, i) => {
      if (Math.abs(h.offsetLeft - p.offsetLeft - p.scrollLeft) < Math.abs(hijos[mejor].offsetLeft - p.offsetLeft - p.scrollLeft)) mejor = i;
    });
    setActual(mejor);
  };

  useEffect(() => {
    if (pausa || reducido || medios.length < 2 || abierto !== null) return;
    const t = setInterval(() => irA(indiceCircular(actual, 1, medios.length)), AVANCE_MS);
    return () => clearInterval(t);
  }, [pausa, reducido, medios.length, actual, abierto, irA]);

  if (medios.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-6"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <ul
        ref={pista}
        onScroll={alDesplazar}
        aria-label="Carrusel de fotos del páramo"
        className="m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth p-0 px-4 pb-2 [scrollbar-width:none] sm:px-8 lg:px-[max(3rem,calc((100vw-80rem)/2+3rem))] [&::-webkit-scrollbar]:hidden"
      >
        {medios.map((m, i) => (
          <li key={m.id} className="w-[78vw] flex-none snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[26rem]">
            <button
              type="button"
              onClick={() => setAbierto(i)}
              aria-label={`Ampliar: ${m.alt}`}
              className={`group relative block h-[52vh] max-h-[520px] min-h-[320px] w-full overflow-hidden rounded-[32px] text-left transition-transform duration-700 ${i === actual ? 'scale-100' : 'scale-[0.96] opacity-90'}`}
            >
              <MiniaturaMedio medio={m} className="transition-transform duration-[1.4s] group-hover:scale-110" />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-bosque/90 via-bosque/30 to-transparent p-6 pt-16 text-white">
                <span className="etiqueta text-lima">{m.categoria}</span>
                <span className="font-display text-xl font-bold">{m.alt}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {medios.map((m, i) => (
            <span key={m.id} className={`h-1.5 rounded-full transition-all duration-500 ${i === actual ? 'w-8 bg-bosque' : 'w-1.5 bg-bosque/25'}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Foto anterior" onClick={() => irA(indiceCircular(actual, -1, medios.length))} className="flex size-12 items-center justify-center rounded-full border border-bosque/20 text-bosque transition-colors hover:bg-bosque hover:text-lima">
            ←
          </button>
          <button type="button" aria-label="Foto siguiente" onClick={() => irA(indiceCircular(actual, 1, medios.length))} className="flex size-12 items-center justify-center rounded-full bg-bosque text-lima transition-colors hover:bg-lima hover:text-bosque">
            →
          </button>
          <Link to="/biblioteca" className="ml-2 hidden items-center gap-1.5 font-display text-sm font-bold no-underline sm:inline-flex">
            Ver la biblioteca <FlechaAccion />
          </Link>
        </div>
      </div>
      <Visor medios={medios} indice={abierto} onCambiar={setAbierto} />
    </div>
  );
}
