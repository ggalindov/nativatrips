import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  opciones: readonly { valor: string; texto: string }[];
}

/** Lista desplegable con el mismo estilo de línea inferior que `Campo`. */
export function Selector({ etiqueta, ayuda, error, opciones, className = '', ...select }: SelectorProps) {
  const id = useId();
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="etiqueta text-tinta-suave">
        {etiqueta}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion}
          className={`h-12 w-full min-w-0 cursor-pointer appearance-none truncate border-0 border-b-2 bg-transparent py-0 pr-8 pl-0 font-sans text-base text-bosque transition-colors focus:border-bosque focus:outline-none ${
            error ? 'border-error' : 'border-bosque/20'
          }`}
          {...select}
        >
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 text-tinta-suave" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error ? (
        <span id={`${id}-error`} className="text-sm text-error">
          {error}
        </span>
      ) : (
        ayuda && (
          <span id={`${id}-ayuda`} className="text-sm text-tinta-suave">
            {ayuda}
          </span>
        )
      )}
    </div>
  );
}
