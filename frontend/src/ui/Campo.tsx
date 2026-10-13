import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  accesorio?: ReactNode;
}

/** Campo de línea inferior con etiqueta en mayúsculas, como en los diseños de Figma. */
export function Campo({ etiqueta, ayuda, error, accesorio, className = '', ...input }: CampoProps) {
  const id = useId();
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="etiqueta text-tinta-suave">
        {etiqueta}
      </label>
      <div className="relative flex">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion}
          className={`h-12 w-full min-w-0 border-0 border-b-2 bg-transparent px-0 font-sans text-base text-bosque transition-colors placeholder:text-tinta-suave/60 focus:border-bosque focus:outline-none ${
            error ? 'border-error' : 'border-bosque/20'
          } ${accesorio ? 'pr-24' : ''}`}
          {...input}
        />
        {accesorio && <div className="absolute right-0 top-1">{accesorio}</div>}
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
