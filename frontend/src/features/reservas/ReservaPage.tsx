import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ajustarPersonas, cuposLibres } from '@/domain/aforo';
import { formatearFecha, hoyIso, sumarDias } from '@/domain/fechas';
import { validarSolicitud } from '@/domain/reserva';
import type { SolicitudReserva } from '@/domain/reserva';
import { formatearDistancia, formatearDuracion, ordenarPorExigencia } from '@/domain/sendero';
import { useServicios } from '@/services/ServiciosContext';
import { mensajeDeError, useConsulta } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { SelectorFecha } from './SelectorFecha';

const DIAS_VISIBLES = 14;

function Seccion({ id, titulo, nota, children }: { id: string; titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t linea pt-5">
        <h2 id={id} className="m-0 font-display text-[26px] font-bold">
          {titulo}
        </h2>
        {nota && <span className="font-mono text-[13px] text-tinta-suave">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

export function ReservaPage() {
  const { senderoId } = useParams();
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
      navegar('/reserva/apartada', { state: { ...creada, correo: titular.correo, senderoNombre: sendero?.nombre, fecha } });
    } catch (err) {
      setErrores([mensajeDeError(err)]);
      dias.recargar();
    } finally {
      setEnviando(false);
    }
  };

  const actualizar = (campo: keyof typeof titular) => (e: ChangeEvent<HTMLInputElement>) =>
    setTitular((t) => ({ ...t, [campo]: e.target.value }));

  return (
    <div className="mx-auto max-w-7xl px-6 pt-14 pb-24">
      <ol aria-label="Progreso" className="m-0 mb-12 flex list-none gap-5 p-0 font-mono text-xs tracking-[0.1em] uppercase">
        <li aria-current="step">1 Reserva</li>
        <li className="text-tinta-suave">2 Pago</li>
        <li className="text-tinta-suave">3 Enlace</li>
      </ol>

      {catalogo.estado.tipo === 'cargando' && <Cargando />}
      {catalogo.estado.tipo === 'error' && <ErrorCarga mensaje={catalogo.estado.mensaje} reintentar={catalogo.recargar} />}

      {catalogo.estado.tipo === 'listo' && !sendero && (
        <div className="flex flex-col gap-8">
          <h1 className="m-0 font-display text-5xl font-extrabold tracking-tight">¿Qué sendero quieres recorrer?</h1>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {ordenarPorExigencia(catalogo.estado.datos).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navegar(`/reservar/${s.id}`)}
                  className="flex w-full flex-col items-start gap-1 tarjeta border border-transparent p-5 text-left text-bosque hover:border-bosque"
                >
                  <span className="font-display text-xl font-bold">{s.nombre}</span>
                  <span className="font-mono text-[13px] text-tinta-suave">
                    {s.dificultad} · {formatearDuracion(s.duracionHoras)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sendero && (
        <form onSubmit={enviar} noValidate className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-14">
            <div className="flex flex-col gap-3">
              <span className="etiqueta text-tinta-suave">
                {sendero.dificultad} · {formatearDuracion(sendero.duracionHoras)} · {formatearDistancia(sendero.distanciaKm)}
              </span>
              <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight md:text-[56px]">{sendero.nombre}</h1>
              <p className="m-0 max-w-[620px] text-[17px] leading-relaxed text-tinta">
                No necesitas crear una cuenta. Al terminar te enviamos un enlace a tu correo para gestionar la reserva.
              </p>
            </div>

            <Seccion id="rv-fecha" titulo="Fecha" nota="Cupos por día">
              {dias.estado.tipo === 'cargando' && <Cargando texto="Consultando cupos…" />}
              {dias.estado.tipo === 'error' && <ErrorCarga mensaje={dias.estado.mensaje} reintentar={dias.recargar} />}
              {dias.estado.tipo === 'listo' && <SelectorFecha dias={dias.estado.datos} seleccionada={fecha} onElegir={elegirFecha} />}
            </Seccion>

            <Seccion id="rv-personas" titulo="Personas">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  aria-label="Quitar una persona"
                  disabled={personas <= 1}
                  onClick={() => setPersonas((p) => Math.max(1, p - 1))}
                  className="h-12 w-12 rounded-full border border-bosque/30 bg-superficie font-mono text-xl disabled:opacity-40"
                >
                  −
                </button>
                <output aria-live="polite" className="min-w-12 text-center font-mono text-[28px]">
                  {personas}
                </output>
                <button
                  type="button"
                  aria-label="Agregar una persona"
                  disabled={!dispFecha || personas >= maximo}
                  onClick={() => setPersonas((p) => p + 1)}
                  className="h-12 w-12 rounded-full border border-bosque/30 bg-superficie font-mono text-xl disabled:opacity-40"
                >
                  +
                </button>
                <span className="text-[15px] text-tinta-suave">{dispFecha ? `Máximo ${maximo} para esta fecha` : 'Elige primero una fecha'}</span>
              </div>
            </Seccion>

            <Seccion id="rv-contacto" titulo="Quién reserva" nota="El enlace llega a este correo">
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo etiqueta="Nombre completo" autoComplete="name" value={titular.nombre} onChange={actualizar('nombre')} />
                <Campo etiqueta="Documento" inputMode="numeric" value={titular.documento} onChange={actualizar('documento')} />
                <Campo etiqueta="Correo" type="email" autoComplete="email" value={titular.correo} onChange={actualizar('correo')} />
                <Campo etiqueta="Celular" type="tel" autoComplete="tel" value={titular.celular} onChange={actualizar('celular')} />
              </div>
              <span className="text-sm text-tinta-suave">Los datos de los acompañantes se piden en el enlace, antes de la salida.</span>
            </Seccion>
          </div>

          <aside aria-label="Resumen" className="flex flex-col gap-6 rounded-[32px] bg-bosque p-8 text-arena lg:sticky lg:top-24">
            <span className="etiqueta text-salvia">Resumen</span>
            <dl className="m-0 flex flex-col gap-3.5 text-[15px]">
              {[
                ['Sendero', sendero.nombre],
                ['Fecha', fecha ? formatearFecha(fecha) : '—'],
                ['Salida', sendero.horaSalida],
                ['Personas', String(personas)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-salvia-clara">{k}</dt>
                  <dd className="m-0 font-mono">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-baseline justify-between gap-3 border-t border-arena/25 pt-5">
              <span className="text-[15px] text-salvia-clara">Total</span>
              <span className="font-mono text-2xl">[PRECIO] COP</span>
            </div>
            {errores.length > 0 && (
              <ul role="alert" className="m-0 flex list-none flex-col gap-1 border-t border-lima/60 p-0 pt-4 text-sm text-lima">
                {errores.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <Boton type="submit" variante="primario" conFlecha cargando={enviando}>
              Apartar cupo y pagar con PayU
            </Boton>
            <span className="text-[13px] leading-normal text-salvia-clara">
              El cupo queda apartado [MINUTOS] minutos mientras completas el pago.
            </span>
          </aside>
        </form>
      )}
    </div>
  );
}
