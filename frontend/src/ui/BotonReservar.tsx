import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import { Link } from 'react-router-dom';

const EnlaceAnimado = motion.create(Link);

const ciclo = { duration: 0.55, repeat: Infinity, ease: 'easeInOut' as const };

const piernaAdelante: Variants = { reposo: { rotate: 8 }, caminar: { rotate: [22, -18, 22], transition: ciclo } };
const piernaAtras: Variants = { reposo: { rotate: -8 }, caminar: { rotate: [-18, 22, -18], transition: ciclo } };
const cuerpo: Variants = {
  reposo: { y: [0, -0.6, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  caminar: { y: [0, -1.2, 0], transition: { duration: 0.275, repeat: Infinity, ease: 'easeInOut' } },
};
const ladera: Variants = {
  reposo: { x: 0 },
  caminar: { x: [0, -6], transition: { duration: 0.55, repeat: Infinity, ease: 'linear' } },
};

/** Excursionista con morral y bastón que sube una ladera; camina al pasar el mouse. */
export function Excursionista({ tamano = 32 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 32 32" aria-hidden="true" className="overflow-visible">
      <defs>
        <clipPath id="excursionista-medallon">
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#excursionista-medallon)">
        <motion.path variants={ladera} d="M-4 29 L40 21.5 L40 34 L-4 34 Z" fill="var(--color-bosque-3)" />
        <motion.path variants={ladera} d="M-2 28.6 L38 21.8" stroke="var(--color-lima)" strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="0.1 2.6" strokeLinecap="round" />
        <circle cx="25.5" cy="7.5" r="2.4" fill="var(--color-lima)" opacity="0.9" />
      </g>
      <motion.g variants={cuerpo}>
        {/* piernas: giran desde la cadera */}
        <motion.path variants={piernaAtras} d="M15.6 18.6 L14.6 24.2" stroke="var(--color-arena)" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" style={{ originX: '15.6px', originY: '18.6px' }} />
        <motion.path variants={piernaAdelante} d="M15.6 18.6 L16.8 24.2" stroke="var(--color-arena)" strokeWidth="2" strokeLinecap="round" style={{ originX: '15.6px', originY: '18.6px' }} />
        {/* morral */}
        <rect x="11.2" y="11.6" width="4" height="6" rx="1.4" fill="var(--color-lima)" />
        <path d="M11.6 12.4 L12.6 11" stroke="var(--color-lima)" strokeWidth="1" strokeLinecap="round" />
        {/* tronco */}
        <path d="M15.4 12.2 L15.7 18.8" stroke="var(--color-arena)" strokeWidth="2.6" strokeLinecap="round" />
        {/* brazo y bastón */}
        <path d="M15.6 13.4 L18.6 16.4" stroke="var(--color-arena)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M19.2 11.4 L20.4 24.6" stroke="var(--color-lima)" strokeWidth="1.2" strokeLinecap="round" />
        {/* cabeza y sombrero */}
        <circle cx="15.8" cy="9" r="2.5" fill="var(--color-arena)" />
        <path d="M12.8 8 Q15.8 4.6 18.8 8 Z" fill="var(--color-lima)" />
        <path d="M12.2 8.1 L19.4 8.1" stroke="var(--color-lima)" strokeWidth="1" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}

interface Props {
  to: string;
  children: ReactNode;
  /** "compacto" para la barra de navegación; "amplio" para el menú móvil. */
  tamano?: 'compacto' | 'amplio';
  className?: string;
  /** Animación permanente (el excursionista camina y un brillo recorre el botón): para la portada y el celular, donde no hay hover. */
  vivo?: boolean;
}

/** Botón principal para reservar, con el excursionista en un medallón. */
export function BotonReservar({ to, children, tamano = 'compacto', className = '', vivo = false }: Props) {
  const amplio = tamano === 'amplio';
  return (
    <EnlaceAnimado
      to={to}
      initial="reposo"
      animate={vivo ? 'caminar' : 'reposo'}
      whileHover="caminar"
      whileFocus="caminar"
      whileTap={{ scale: 0.97 }}
      className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-lima font-display font-bold text-bosque no-underline shadow-[0_10px_30px_-12px_rgb(220_235_107/0.7)] transition-colors hover:bg-white hover:text-bosque ${
        amplio ? 'h-14 justify-center pr-2 pl-6 text-base' : 'h-11 pr-1.5 pl-5 text-sm'
      } ${className}`}
    >
      {vivo ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/60 blur-md"
          initial={{ left: '-50%' }}
          animate={{ left: ['-50%', '130%', '130%'] }}
          transition={{ duration: 3.2, times: [0, 0.35, 1], repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/50 opacity-0 blur-md transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
      )}
      <span className="relative">{children}</span>
      <span className={`relative flex flex-none items-center justify-center overflow-hidden rounded-full bg-bosque ${amplio ? 'size-11' : 'size-8'}`}>
        <Excursionista tamano={amplio ? 44 : 32} />
      </span>
    </EnlaceAnimado>
  );
}
