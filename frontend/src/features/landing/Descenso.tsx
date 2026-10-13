import { ETAPAS, altitudPorProgreso, formatearAltitud, indiceEtapa } from '@/domain/descenso';
import { EnlaceBoton } from '@/ui/Boton';
import { EscenaParamo } from './EscenaParamo';
import { useProgresoScroll } from './useProgresoScroll';

/** Portada: 340 vh de scroll sobre una escena fija; el scroll es el descenso. */
export function Descenso() {
  const { ref, progreso, reducido } = useProgresoScroll<HTMLElement>();
  const etapa = indiceEtapa(progreso);

  return (
    <section ref={ref} id="inicio" className="relative h-[340vh]" aria-label="Descenso por el páramo">
      <div className="sticky top-[68px] h-[calc(100svh-68px)] overflow-hidden bg-arena-oscura">
        <EscenaParamo progreso={progreso} reducido={reducido} />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 pt-10 sm:px-8 md:pt-14 lg:px-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-bosque px-4 py-1.5 text-[11px] font-bold tracking-widest text-lima uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-lima" />
            PNN Chingaza · La Calera
          </span>
          <h1 className="m-0 max-w-[860px] font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-bosque md:text-[84px]">
            El páramo se recorre despacio.
          </h1>
          <p className="m-0 max-w-[540px] text-lg leading-relaxed text-tinta">
            Trece senderos con cupos limitados por la capacidad de carga del parque. Reserva en minutos, sin crear una cuenta.
          </p>
          <EnlaceBoton to="/reservar" conFlecha>
            Reservar un sendero
          </EnlaceBoton>
        </div>

        <div className="absolute inset-x-4 bottom-8 z-10 mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 sm:inset-x-8 lg:inset-x-12">
          <div aria-live="polite" className="tarjeta flex max-w-[380px] flex-col gap-1.5 px-5 py-4">
            <span className="etiqueta text-tinta-suave">
              {etapa + 1}/4 · {ETAPAS[etapa].nombre}
            </span>
            <span className="text-[15px] leading-snug">{ETAPAS[etapa].texto}</span>
          </div>
          <div className="flex flex-col items-end gap-1 rounded-3xl bg-bosque/85 px-6 py-4 backdrop-blur">
            <span className="font-cifras text-4xl leading-none font-black text-lima-suave md:text-5xl" data-testid="altimetro">
              {formatearAltitud(altitudPorProgreso(progreso))}
            </span>
            <span className="etiqueta text-white/70">m s.n.m.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
