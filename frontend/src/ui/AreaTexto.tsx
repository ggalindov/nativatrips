import { useId } from 'react';

interface AreaTextoProps {
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  filas?: number;
  maximo?: number;
  ayuda?: string;
  error?: string;
}

/** Texto de varias líneas con la misma etiqueta, ayuda y error que Campo. */
export function AreaTexto({ etiqueta, valor, onCambio, filas = 4, maximo, ayuda, error }: AreaTextoProps) {
  const id = useId();
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="etiqueta text-tinta-suave">
        {etiqueta}
      </label>
      <textarea
        id={id}
        value={valor}
        rows={filas}
        maxLength={maximo}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion}
        onChange={(e) => onCambio(e.target.value)}
        className={`rounded-2xl border bg-superficie p-4 font-sans text-[15px] leading-relaxed text-bosque focus:border-bosque focus:outline-none ${
          error ? 'border-error' : 'border-bosque/20'
        }`}
      />
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
