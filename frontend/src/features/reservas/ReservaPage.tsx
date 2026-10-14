import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import { ajustarPersonas, cuposLibres, nivelAforo } from '@/domain/aforo';
import { formatearFecha, hoyIso, sumarDias } from '@/domain/fechas';
import { validarSolicitud } from '@/domain/reserva';
import type { SolicitudReserva } from '@/domain/reserva';
import { formatearDistancia, formatearDuracion, formatearPesos, ordenarPorExigencia, totalReserva } from '@/domain/sendero';
import { useServicios } from '@/services/ServiciosContext';
import { mensajeDeError, useConsulta } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, CURVA, Escalonado, FotoAnimada, itemEscalonado } from '@/ui/movimiento';
import { SelectorFecha } from './SelectorFecha';

const DIAS_VISIBLES = 14;

function Seccion({ id, numero, titulo, nota, children }: { id: string; numero: number; titulo: string; nota?: string; children: ReactNode }) {
  return (
    <Aparecer como="section" className="tarjeta flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-bosque font-cifras text-sm font-black text-lima">{numero}</span>
          <h2 id={id} className="m-0 font-display text-2xl font-bold">
            {titulo}
          </h2>
        </div>
        {nota && <span className="text-sm text-tinta-suave">{nota}</span>}
      </div>
      {children}
    </Aparecer>
  );
}

const PASOS = ['Reserva', 'Pago', 'Enlace'];

function Pasos() {
  return (
    <ol aria-label="Progreso" className="m-0 flex list-none items-center gap-2 p-0 sm:gap-3">
      {PASOS.map((p, i) => (
        <li key={p} aria-current={i === 0 ? 'step' : undefined} className="flex items-center gap-2 sm:gap-3">
          <span className={`flex size-7 flex-none items-center justify-center rounded-full text-sm font-bold sm:size-8 ${i === 0 ? 'bg-lima text-bosque' : 'bg-white/15 text-white/70'}`}>{i + 1}</span>
          <span className={`text-sm font-semibold ${i === 0 ? 'text-white' : 'text-white/60'}`}>{p}</span>
          {i < PASOS.length - 1 && <span aria-hidden="true" className="h-px w-4 bg-white/25 sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}

export function ReservaPage() {
  const { senderoId } = useParams();
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  const { senderos, reservas } = useServicios();
  const desde = useMemo(() => sumarDias(hoyIso(), 1), []);

  const catalogo = useConsulta(() => senderos.listar(), [senderos]);
  const idActual = senderoId ?? null;
  const dias = useConsulta(
    () => (idActual ? senderos.disponibilidad(idActual, desde, DIAS_VISIBLES) : Promise.resolve([])),
    [senderos, idActual, desde],
  );

  const [fecha, setFecha] = useState<string | null>(null);
  const [personas, setPersonas] = useState(1);
  const [titular, setTitular] = useState({ nombre: '', documento: '', correo: '', celular: '' });
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const sendero = catalogo.estado.tipo === 'listo' ? catalogo.estado.datos.find((s) => s.id === idActual) : undefined;
  const dispFecha = dias.estado.tipo === 'listo' ? dias.estado.datos.find((d) => d.fecha === fecha) : undefined;
  const maximo = dispFecha ? cuposLibres(dispFecha) : 0;
  const total = sendero ? totalReserva(sendero, personas) : null;

  // Si se llega desde la ficha con ?fecha=, se preselecciona cuando hay cupos.
  const fechaSugerida = parametros.get('fecha');
  useEffect(() => {
    if (fecha || !fechaSugerida || dias.estado.tipo !== 'listo') return;
    const d = dias.estado.datos.find((x) => x.fecha === fechaSugerida);
    if (d && nivelAforo(d) !== 'lleno') setFecha(fechaSugerida);
  }, [fecha, fechaSugerida, dias.estado]);

  const elegirFecha = (f: string) => {
    setFecha(f);
    const d = dias.estado.tipo === 'listo' ? dias.estado.datos.find((x) => x.fecha === f) : undefined;
    if (d) setPersonas((p) => ajustarPersonas(p, d));
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!idActual) return;
    const solicitud: SolicitudReserva = { senderoId: idActual, fecha: fecha ?? '', personas, titular };
    const encontrados = validarSolicitud(solicitud);
    setErrores(encontrados);
    if (encontrados.length > 0) return;
    setEnviando(true);
    try {
      const creada = await reservas.crear(solicitud);
      navegar('/reserva/apartada', {
        state: { ...creada, correo: titular.correo, titular: titular.nombre, senderoId: idActual, senderoNombre: sendero?.nombre, fecha, personas, total, horaSalida: sendero?.horaSalida, puntoEncuentro: sendero?.puntoEncuentro },
      });
    } catch (err) {
      setErrores([mensajeDeError(err)]);
      dias.recargar();
    } finally {
      setEnviando(false);
    }
  };

  const actualizar = (campo: keyof typeof titular) => (e: ChangeEvent<HTMLInputElement>) => setTitular((t) => ({ ...t, [campo]: e.target.value }));

  if (catalogo.estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-4 py-20"><Cargando /></div>;
  if (catalogo.estado.tipo === 'error') return <div className="mx-auto max-w-7xl px-4 py-20"><ErrorCarga mensaje={catalogo.estado.mensaje} reintentar={catalogo.recargar} /></div>;

  if (!sendero) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-32 pb-16 sm:px-8 lg:px-12">
        <Aparecer>
          <span className="etiqueta text-tinta-suave">Reservar</span>
          <h1 className="m-0 mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">¿Qué sendero quieres recorrer?</h1>
        </Aparecer>
        <Escalonado inmediato como="ul" className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {ordenarPorExigencia(catalogo.estado.datos).map((s) => {
            const f = fotoDeSendero(s.id);
            return (
              <motion.li key={s.id} variants={itemEscalonado}>
                <button
                  type="button"
                  onClick={() => navegar(`/reservar/${s.id}`)}
                  className="group relative flex h-44 w-full flex-col justify-end overflow-hidden rounded-[28px] p-5 text-left text-white"
                >
                  <img src={f.srcPequena} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bosque/90 to-bosque/10" />
                  <span className="relative font-display text-xl font-bold">{s.nombre}</span>
                  <span className="relative text-sm text-white/80">
                    {s.dificultad} · {formatearDuracion(s.duracionHoras)}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </Escalonado>
      </div>
    );
  }

  const portada = fotoDeSendero(sendero.id);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-bosque text-white">
        <div className="absolute inset-0 -z-10">
          <FotoAnimada src={portada.src} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-r from-bosque via-bosque/80 to-bosque/30" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 pt-32 pb-14 sm:px-8 md:pt-36 md:pb-20 lg:px-12">
          <Pasos />
          <span className="etiqueta text-lima">
            {sendero.dificultad} · {formatearDuracion(sendero.duracionHoras)} · {formatearDistancia(sendero.distanciaKm)}
          </span>
          <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight md:text-6xl">{sendero.nombre}</h1>
          <p className="m-0 max-w-[620px] text-[17px] leading-relaxed text-white/80">
            No necesitas crear una cuenta. Al terminar te enviamos un enlace a tu correo para gestionar la reserva.
          </p>
        </div>
      </section>

      <form onSubmit={enviar} noValidate className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-12">
        <div className="flex flex-col gap-6">
          <Seccion id="rv-fecha" numero={1} titulo="Fecha" nota="Cupos por día, en vivo">
            {dias.estado.tipo === 'cargando' && <Cargando texto="Consultando cupos…" />}
            {dias.estado.tipo === 'error' && <ErrorCarga mensaje={dias.estado.mensaje} reintentar={dias.recargar} />}
            {dias.estado.tipo === 'listo' && <SelectorFecha dias={dias.estado.datos} seleccionada={fecha} onElegir={elegirFecha} />}
          </Seccion>

          <Seccion id="rv-personas" numero={2} titulo="Personas">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                aria-label="Quitar una persona"
                disabled={personas <= 1}
                onClick={() => setPersonas((p) => Math.max(1, p - 1))}
                className="size-12 rounded-full border border-bosque/20 bg-arena font-display text-xl font-bold transition-colors hover:bg-bosque hover:text-lima disabled:opacity-40"
              >
                −
              </button>
              <output aria-live="polite" className="min-w-14 text-center font-cifras text-3xl font-black">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={personas} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }} transition={{ duration: 0.25 }} className="inline-block">
                    {personas}
                  </motion.span>
                </AnimatePresence>
              </output>
              <button
                type="button"
                aria-label="Agregar una persona"
                disabled={!dispFecha || personas >= maximo}
                onClick={() => setPersonas((p) => p + 1)}
                className="size-12 rounded-full border border-bosque/20 bg-arena font-display text-xl font-bold transition-colors hover:bg-bosque hover:text-lima disabled:opacity-40"
              >
                +
              </button>
              <span className="text-[15px] text-tinta-suave">{dispFecha ? `Máximo ${maximo} para esta fecha` : 'Elige primero una fecha'}</span>
            </div>
          </Seccion>

          <Seccion id="rv-contacto" numero={3} titulo="Quién reserva" nota="El enlace llega a este correo">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2">
              <Campo etiqueta="Nombre completo" autoComplete="name" value={titular.nombre} onChange={actualizar('nombre')} />
              <Campo etiqueta="Documento" inputMode="numeric" value={titular.documento} onChange={actualizar('documento')} />
              <Campo etiqueta="Correo" type="email" autoComplete="email" value={titular.correo} onChange={actualizar('correo')} />
              <Campo etiqueta="Celular" type="tel" autoComplete="tel" value={titular.celular} onChange={actualizar('celular')} />
            </div>
            <span className="text-sm text-tinta-suave">Los datos de los acompañantes se piden en el enlace, antes de la salida.</span>
          </Seccion>
        </div>

        <aside aria-label="Resumen" className="flex flex-col gap-6 overflow-hidden rounded-[32px] bg-bosque text-white shadow-2xl lg:sticky lg:top-24">
          <div className="relative h-36">
            <img src={portada.srcPequena} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bosque to-transparent" />
            <span className="etiqueta absolute bottom-3 left-7 text-lima">Resumen</span>
          </div>
          <div className="flex flex-col gap-6 px-7 pb-7">
            <dl className="m-0 flex flex-col gap-3 text-[15px]">
              {[
                ['Sendero', sendero.nombre],
                ['Fecha', fecha ? formatearFecha(fecha) : '—'],
                ['Salida', sendero.horaSalida],
                ['Personas', String(personas)],
                ['Tarifa por persona', formatearPesos(sendero.precioPorPersona)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-white/70">{k}</dt>
                  <dd className="m-0 font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-baseline justify-between gap-3 border-t border-white/15 pt-5">
              <span className="text-[15px] text-white/70">Total</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={total ?? 'na'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: CURVA }} className="font-cifras text-2xl font-black text-lima-suave">
                  {formatearPesos(total)}
                </motion.span>
              </AnimatePresence>
            </div>
            {errores.length > 0 && (
              <ul role="alert" className="m-0 flex list-none flex-col gap-1 rounded-2xl bg-error/20 p-4 text-sm text-white">
                {errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <Boton type="submit" conFlecha cargando={enviando} className="h-14">
              Apartar cupo y pagar con PayU
            </Boton>
            <span className="text-[13px] leading-normal text-white/60">El cupo queda apartado [MINUTOS] minutos mientras completas el pago.</span>
          </div>
        </aside>
      </form>
    </>
  );
}
