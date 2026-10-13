import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';

/** Curva de la marca: arranque rápido y llegada suave, como bajar por un sendero. */
export const CURVA = [0.22, 1, 0.36, 1] as const;

interface AparecerProps {
  children: ReactNode;
  className?: string;
  /** Desplazamiento inicial en px; con movimiento reducido solo hay fundido. */
  desde?: number;
  retraso?: number;
  como?: 'div' | 'section' | 'li' | 'article' | 'header';
}

/** Entra en escena con fundido y un leve ascenso al aparecer en pantalla. */
export function Aparecer({ children, className, desde = 28, retraso = 0, como = 'div' }: AparecerProps) {
  const reducido = useReducedMotion();
  const Componente = motion[como];
  return (
    <Componente
      className={className}
      initial={{ opacity: 0, y: reducido ? 0 : desde }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: CURVA, delay: retraso }}
    >
      {children}
    </Componente>
  );
}

const contenedor: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const itemEscalonado: Variants = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: CURVA } },
};

interface EscalonadoProps {
  children: ReactNode;
  className?: string;
  como?: 'div' | 'ul' | 'ol' | 'dl';
  /** Anima al montarse en lugar de esperar a entrar en pantalla (contenido visible al cargar). */
  inmediato?: boolean;
}

/** Lista cuyos hijos (con `variants={itemEscalonado}`) entran uno tras otro. */
export function Escalonado({ children, className, como = 'div', inmediato = false }: EscalonadoProps) {
  const Componente = motion[como];
  const disparo = inmediato ? { animate: 'visible' } : { whileInView: 'visible', viewport: { once: true, margin: '-60px' } };
  return (
    <Componente className={className} variants={contenedor} initial="oculto" {...disparo}>
      {children}
    </Componente>
  );
}

const enteros = new Intl.NumberFormat('es-CO');

/** Cuenta desde cero hasta el valor cuando entra en pantalla. */
export function Contador({ valor, sufijo = '', className }: { valor: number; sufijo?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reducido = useReducedMotion();
  const [actual, setActual] = useState(reducido ? valor : 0);

  useEffect(() => {
    if (!visible || reducido) {
      if (reducido) setActual(valor);
      return;
    }
    const control = animate(0, valor, { duration: 1.6, ease: CURVA, onUpdate: (v) => setActual(Math.round(v)) });
    return () => control.stop();
  }, [visible, valor, reducido]);

  return (
    <span ref={ref} className={className}>
      {enteros.format(actual)}
      {sufijo}
    </span>
  );
}

/** Franja que se desplaza sin fin; se pausa al pasar el mouse y no se mueve con movimiento reducido. */
export function Marquesina({ children, segundos = 40 }: { children: ReactNode; segundos?: number }) {
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
      <div
        className="flex w-max gap-4 motion-safe:animate-[marquesina_var(--duracion)_linear_infinite] group-hover:[animation-play-state:paused]"
        style={{ ['--duracion' as string]: `${segundos}s` }}
      >
        {children}
        <div aria-hidden="true" className="flex gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FotoAnimadaProps {
  src: string;
  alt: string;
  className?: string;
  /** Acercamiento lento continuo (efecto Ken Burns). */
  kenBurns?: boolean;
  prioridad?: boolean;
}

/** Foto que entra con fundido al cargar y, opcionalmente, se acerca lentamente. */
export function FotoAnimada({ src, alt, className = '', kenBurns = false, prioridad = false }: FotoAnimadaProps) {
  const [cargada, setCargada] = useState(false);
  const reducido = useReducedMotion();
  return (
    <motion.img
      src={src}
      alt={alt}
      loading={prioridad ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setCargada(true)}
      className={`h-full w-full object-cover ${className}`}
      initial={{ opacity: 0, scale: reducido ? 1 : 1.06 }}
      animate={cargada ? { opacity: 1, scale: kenBurns && !reducido ? 1.12 : 1 } : undefined}
      transition={{
        opacity: { duration: 0.9, ease: CURVA },
        scale: kenBurns ? { duration: 18, ease: 'linear' } : { duration: 1.2, ease: CURVA },
      }}
    />
  );
}
