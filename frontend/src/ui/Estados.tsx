import { Boton } from './Boton';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p role="status" className="font-mono text-sm text-tinta-suave">
      {texto}
    </p>
  );
}

export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-t border-error pt-4">
      <p className="m-0 text-base text-error">{mensaje}</p>
      {reintentar && (
        <Boton variante="secundario" onClick={reintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}
