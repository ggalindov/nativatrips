/** Montaña con laguna: el ícono de la insignia lima de la marca. */
export function IconoMontana({ tamano = 20 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

interface LogoProps {
  /** Texto pequeño bajo el nombre. */
  lema?: string;
  /** "oscuro" = sobre fondo bosque (texto blanco); "claro" = sobre arena. */
  tono?: 'oscuro' | 'claro';
}

export function Logo({ lema = 'PNN Chingaza', tono = 'oscuro' }: LogoProps) {
  return (
    <span className="group inline-flex items-center gap-3 select-none">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-lima text-bosque shadow-md transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
        <IconoMontana />
      </span>
      <span className="flex flex-col">
        <span
          className={`font-display text-2xl leading-none font-extrabold tracking-tight transition-colors group-hover:text-lima ${
            tono === 'oscuro' ? 'text-white' : 'text-bosque'
          }`}
        >
          NativaTrips
        </span>
        <span className="mt-1 hidden items-center gap-1 text-[10px] font-bold tracking-widest text-lima uppercase min-[420px]:flex">
          {lema}
          <span aria-hidden="true" className="size-1 rounded-full bg-lima" />
          <span className={tono === 'oscuro' ? 'text-white/60' : 'text-tinta-suave'}>Colombia</span>
        </span>
      </span>
    </span>
  );
}
