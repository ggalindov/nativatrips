import { motion } from 'motion/react';
import { todasLasFotos } from '@/contenido/fotos';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { Aparecer, Escalonado, itemEscalonado } from '@/ui/movimiento';

/** Atribución de cada fotografía, como exigen las licencias Creative Commons. */
export function CreditosPage() {
  const fotos = todasLasFotos();
  const { t } = useIdioma();
  const { alt } = useContenido();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-32 pb-20 sm:px-8 lg:px-12">
      <Aparecer className="flex max-w-3xl flex-col gap-4">
        <span className="etiqueta text-tinta-suave">{t.creditos.etiqueta}</span>
        <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{t.creditos.titulo}</h1>
        <p className="m-0 text-[17px] leading-relaxed text-tinta">{t.creditos.texto}</p>
      </Aparecer>
      <Escalonado como="ul" className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {fotos.map((f) => (
          <motion.li key={f.id} variants={itemEscalonado} className="tarjeta overflow-hidden">
            <img src={f.srcPequena} alt={alt(f)} loading="lazy" className="h-44 w-full object-cover" />
            <div className="flex flex-col gap-1 p-5 text-sm">
              <span className="font-display text-base font-bold">{alt(f)}</span>
              <span className="text-tinta">{t.creditos.autor(f.autor)}</span>
              <span>
                {t.creditos.licencia}{' '}
                <a href={f.licenciaUrl} target="_blank" rel="noreferrer">
                  {f.licencia}
                </a>{' '}
                ·{' '}
                <a href={f.fuente} target="_blank" rel="noreferrer">
                  {t.creditos.fuente}
                </a>
              </span>
            </div>
          </motion.li>
        ))}
      </Escalonado>
    </div>
  );
}
