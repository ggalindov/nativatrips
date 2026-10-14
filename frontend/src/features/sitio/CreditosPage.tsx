import { motion } from 'motion/react';
import { todasLasFotos } from '@/contenido/fotos';
import { Aparecer, Escalonado, itemEscalonado } from '@/ui/movimiento';

/** Atribución de cada fotografía, como exigen las licencias Creative Commons. */
export function CreditosPage() {
  const fotos = todasLasFotos();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-32 pb-20 sm:px-8 lg:px-12">
      <Aparecer className="flex max-w-3xl flex-col gap-4">
        <span className="etiqueta text-tinta-suave">Créditos</span>
        <h1 className="m-0 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Fotografías del páramo</h1>
        <p className="m-0 text-[17px] leading-relaxed text-tinta">
          Las fotografías son de autores que las publicaron en Wikimedia Commons con licencias libres. Se muestran sin
          modificar su contenido, solo reducidas de tamaño. Gracias a cada autor por compartir el páramo de Chingaza.
        </p>
      </Aparecer>
      <Escalonado como="ul" className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {fotos.map((f) => (
          <motion.li key={f.id} variants={itemEscalonado} className="tarjeta overflow-hidden">
            <img src={f.srcPequena} alt={f.alt} loading="lazy" className="h-44 w-full object-cover" />
            <div className="flex flex-col gap-1 p-5 text-sm">
              <span className="font-display text-base font-bold">{f.alt}</span>
              <span className="text-tinta">Autor: {f.autor}</span>
              <span>
                Licencia{' '}
                <a href={f.licenciaUrl} target="_blank" rel="noreferrer">
                  {f.licencia}
                </a>{' '}
                ·{' '}
                <a href={f.fuente} target="_blank" rel="noreferrer">
                  Fuente
                </a>
              </span>
            </div>
          </motion.li>
        ))}
      </Escalonado>
    </div>
  );
}
