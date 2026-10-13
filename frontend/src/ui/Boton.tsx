import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

export type VarianteBoton = 'primario' | 'oscuro' | 'secundario' | 'secundarioClaro' | 'peligro';

/** Botones píldora de la marca; el principal es lima con flecha ↗. */
const BASE =
  'inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full font-display font-bold text-[15px] no-underline transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const VARIANTES: Record<VarianteBoton, string> = {
  primario: 'bg-lima text-bosque shadow-md hover:bg-lima-hover hover:text-bosque hover:shadow-lg',
  oscuro: 'bg-bosque text-white hover:bg-bosque-2 hover:text-white',
  secundario: 'border border-bosque/30 text-bosque bg-transparent hover:border-bosque hover:bg-bosque hover:text-white',
  secundarioClaro: 'border border-white/30 text-white bg-transparent hover:bg-white hover:text-bosque',
  peligro: 'bg-error text-white hover:bg-bosque hover:text-white',
};

export function clasesBoton(variante: VarianteBoton = 'primario', extra = ''): string {
  return `${BASE} ${VARIANTES[variante]} ${extra}`.trim();
}

/** Flecha diagonal de los llamados a la acción. */
export function FlechaAccion() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  cargando?: boolean;
  conFlecha?: boolean;
  children: ReactNode;
}

export function Boton({
  variante = 'primario',
  cargando = false,
  conFlecha = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...resto
}: BotonProps) {
  return (
    <button type={type} className={clasesBoton(variante, className)} disabled={disabled || cargando} aria-busy={cargando} {...resto}>
      {cargando ? 'Un momento…' : children}
      {conFlecha && !cargando && <FlechaAccion />}
    </button>
  );
}

interface EnlaceBotonProps extends LinkProps {
  variante?: VarianteBoton;
  conFlecha?: boolean;
}

export function EnlaceBoton({ variante = 'primario', conFlecha = false, className = '', children, ...resto }: EnlaceBotonProps) {
  return (
    <Link className={clasesBoton(variante, className)} {...resto}>
      {children}
      {conFlecha && <FlechaAccion />}
    </Link>
  );
}
