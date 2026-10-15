import { useIdioma } from '@/i18n/IdiomaContext';
import { Boton } from './Boton';

export function Cargando({ texto }: { texto?: string }) {
  const { t } = useIdioma();
  return (
    <p role="status" className="font-mono text-sm text-tinta-suave">
      {texto ?? t.comun.cargando}
    </p>
  );
}

/** Espacio reservado mientras llega el código de una página que aún no se había visitado. */
export function CargandoPagina() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <span aria-hidden="true" className="size-8 animate-spin rounded-full border-2 border-bosque/15 border-t-lima" />
      <span className="sr-only">
        <Cargando />
      </span>
    </div>
  );
}

export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  const { t } = useIdioma();
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-t border-error pt-4">
      <p className="m-0 text-base text-error">{mensaje}</p>
      {reintentar && (
        <Boton variante="secundario" onClick={reintentar}>
          {t.comun.reintentar}
        </Boton>
      )}
    </div>
  );
}
