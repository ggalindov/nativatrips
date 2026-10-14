import { motion } from 'motion/react';

interface SimboloProps {
  tamano?: number;
  /** Anima el sendero que sube a la cima (pantalla de carga y hover). */
  animado?: boolean;
}

/**
 * Símbolo de NativaTrips: dos picos del páramo, el sendero punteado que sube
 * hasta la cima y el sol lima. Funciona sobre fondo claro y oscuro.
 */
export function Simbolo({ tamano = 40, animado = false }: SimboloProps) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 48 48" aria-hidden="true" className="flex-none overflow-visible">
      <rect width="48" height="48" rx="15" fill="var(--color-lima)" />
      <path d="M5 38 L17.5 17 L24 27 L31 13 L43 38 Z" fill="var(--color-bosque)" />
      <path d="M27.4 20.2 L31 13 L34.6 20.2 L32.4 19 L31 21 L29.4 19 Z" fill="var(--color-arena)" />
      <motion.path
        d="M14 38 C 18 34, 21 33, 23.5 30 S 28 24, 30.6 20"
        fill="none"
        stroke="var(--color-lima)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="0.1 3.2"
        initial={animado ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />
      <motion.circle
        cx="39"
        cy="10"
        r="3.4"
        fill="var(--color-bosque)"
        initial={animado ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 1.2 }}
      />
    </svg>
  );
}

interface LogoProps {
  /** Texto pequeño bajo el nombre. */
  lema?: string;
  /** "oscuro" = sobre fondo bosque (texto blanco); "claro" = sobre arena. */
  tono?: 'oscuro' | 'claro';
  compacto?: boolean;
  /** Firma bajo el nombre en la versión compacta: "by Ecopalacio Chingaza". */
  firma?: boolean;
}

export function Logo({ lema = 'PNN Chingaza · Colombia', tono = 'oscuro', compacto = false, firma = false }: LogoProps) {
  const claro = tono === 'claro';
  return (
    <span className="group inline-flex items-center gap-3 select-none">
      <span className="transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
        <Simbolo tamano={compacto ? 36 : 40} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[22px] tracking-tight ${claro ? 'text-bosque' : 'text-white'}`}>
          <span className="font-extrabold">Nativa</span>
          <span className="font-light text-lima">Trips</span>
        </span>
        {compacto && firma && (
          <span className={`mt-[3px] text-[9px] font-semibold tracking-[0.14em] whitespace-nowrap uppercase ${claro ? 'text-tinta-suave' : 'text-white/60'}`}>
            <span className="font-normal normal-case italic">by</span> Ecopalacio <span className="text-lima">Chingaza</span>
          </span>
        )}
        {!compacto && (
          <span className={`mt-1 hidden text-[9.5px] font-semibold tracking-[0.22em] uppercase min-[420px]:block ${claro ? 'text-tinta-suave' : 'text-white/55'}`}>
            {lema}
          </span>
        )}
      </span>
    </span>
  );
}
