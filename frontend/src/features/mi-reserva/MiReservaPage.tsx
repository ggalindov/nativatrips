import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import { bandera, esExtranjero } from '@/domain/paises';
import type { ErrorValidacion, Persona, Reserva } from '@/domain/reserva';
import { PERSONA_VACIA, acompanantesPendientes, pasosRecorrido, puedeCancelarse, validarPersona } from '@/domain/reserva';
import { AvisoExtranjeros, CamposPersona } from '@/features/reservas/CamposPersona';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { FotoAnimada } from '@/ui/movimiento';

/** Fila de un visitante registrado: bandera, nombre y documento. */
function FilaVisitante({ persona, etiqueta }: { persona: Persona; etiqueta?: string }) {
  const { t, locale } = useIdioma();
  const pais = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([locale], { type: 'region' }).of(persona.nacionalidad) : persona.nacionalidad;
  return (
    <li className="flex items-center justify-between gap-4 border-t linea py-3 text-[15px]">
      <span className="flex min-w-0 items-center gap-3">
        <span role="img" aria-label={pais} className="text-xl">
          {bandera(persona.nacionalidad)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{persona.nombre}</span>
          {etiqueta && <span className="text-xs text-tinta-suave">{etiqueta}</span>}
        </span>
      </span>
      <span className="flex-none text-right font-mono text-sm text-tinta-suave">
        {t.persona.documentosCortos[persona.tipoDocumento]} {persona.documento}
      </span>
    </li>
  );
}

function Acompanantes({ reserva, token, onCambio }: { reserva: Reserva; token: string; onCambio: (r: Reserva) => void }) {
  const { reservas } = useServicios();
  const { t } = useIdioma();
  const mensajeDeError = useMensajeError();
  const [persona, setPersona] = useState<Persona>(PERSONA_VACIA);
  const [errores, setErrores] = useState<ErrorValidacion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const pendientes = acompanantesPendientes(reserva);
  const m = t.miReserva;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validarPersona(persona);
    setErrores(encontrados);
    setError(null);
    if (encontrados.length > 0) return;
    setGuardando(true);
    try {
      onCambio(await reservas.agregarAcompanante(token, persona));
      setPersona(PERSONA_VACIA);
      setErrores([]);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="mr-acomp" className="tarjeta flex flex-col gap-5 p-6 md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="mr-acomp" className="m-0 font-display text-[26px] font-bold">
          {m.acompanantes}
        </h2>
        <span className="font-mono text-[13px] text-tinta-suave">{pendientes === 0 ? m.completo : m.pendientes(pendientes)}</span>
      </div>
      <ul aria-label={m.acompanantes} className="m-0 flex list-none flex-col p-0">
        <FilaVisitante persona={reserva.titular} etiqueta={m.titular} />
        {reserva.acompanantes.map((a) => (
          <FilaVisitante key={`${a.tipoDocumento}-${a.documento}`} persona={a} />
        ))}
      </ul>
      {reserva.personas === 1 ? (
        <p className="m-0 text-[15px] text-tinta">{m.unaPersona}</p>
      ) : (
        pendientes > 0 &&
        puedeCancelarse(reserva) && (
          <form onSubmit={guardar} noValidate className="flex flex-col gap-5 border-t linea pt-5">
            <p className="m-0 text-[15px] leading-relaxed text-tinta">{m.exigeDatos}</p>
            <CamposPersona nombreGrupo="acompanante" persona={persona} errores={errores} onCambio={setPersona} />
            <AnimatePresence>{esExtranjero(persona.nacionalidad) && <AvisoExtranjeros />}</AnimatePresence>
            {error && (
              <p role="alert" className="m-0 text-sm text-error">
                {error}
              </p>
            )}
            <div>
              <Boton type="submit" cargando={guardando}>
                {m.guardar}
              </Boton>
            </div>
          </form>
        )
      )}
    </section>
  );
}

export function MiReservaPage() {
  const { token = '' } = useParams();
  const { reservas } = useServicios();
  const { t, f } = useIdioma();
  const m = t.miReserva;
  const { estado, setEstado, recargar } = useConsulta(() => reservas.abrirConEnlace(token), [reservas, token]);
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  if (estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-6 py-20"><Cargando texto={m.abriendo} /></div>;
  if (estado.tipo === 'error') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-20">
        <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />
        <Link to="/mi-reserva">{m.pedirNuevo}</Link>
      </div>
    );
  }

  const r = estado.datos;
  const actualizar = (nueva: Reserva) => setEstado({ tipo: 'listo', datos: nueva });
  const cancelar = async () => {
    setCancelando(true);
    try {
      actualizar(await reservas.cancelar(token));
    } catch (error) {
      setEstado({ tipo: 'error', error });
    } finally {
      setCancelando(false);
      setConfirmando(false);
    }
  };

  return (
    <>
      <section className="relative isolate h-56 overflow-hidden bg-bosque md:h-72" aria-hidden="true">
        <FotoAnimada src={fotoDeSendero(r.senderoId).src} alt="" kenBurns prioridad />
        <div className="absolute inset-0 bg-gradient-to-t from-arena via-arena/20 to-transparent" />
      </section>
      <div className="relative mx-auto -mt-24 flex max-w-7xl flex-col gap-14 px-4 pb-24 sm:px-8 lg:px-12">
        <div className="tarjeta flex flex-wrap items-end justify-between gap-8 p-8">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[13px] text-tinta-suave">{m.reserva(r.codigo)}</span>
            <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight md:text-[56px]">{r.senderoNombre}</h1>
            <span className="font-mono text-[15px]">
              {f.fecha(r.fecha)} · {r.horaSalida} · {t.comun.personas(r.personas)}
            </span>
          </div>
          <motion.span key={r.estado} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex h-10 items-center gap-2.5 rounded-full bg-bosque px-4 font-mono text-[13px] tracking-[0.08em] text-arena uppercase">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-lima" />
            {t.estados[r.estado]}
          </motion.span>
        </div>

        {r.estado !== 'CANCELADA' && r.estado !== 'EXPIRADA' && (
          <ol aria-label={m.estadoAria} className="m-0 grid list-none gap-2 p-0 sm:grid-cols-4">
            {pasosRecorrido(r.estado).map((p) => (
              <li
                key={p.estado}
                aria-current={p.paso === 'actual' ? 'step' : undefined}
                className={`flex flex-col gap-1 border-t-[3px] pt-3.5 ${p.paso === 'actual' ? 'border-lima' : p.paso === 'hecho' ? 'border-bosque' : 'border-bosque/20 text-tinta-suave'}`}
              >
                <span className="font-semibold">{t.estados[p.estado]}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-12">
            {r.estado === 'PENDIENTE_PAGO' && (
              <section className="flex flex-col items-start gap-4 rounded-[28px] bg-bosque p-6 text-white md:p-8">
                <h2 className="m-0 font-display text-[26px] font-bold">{m.faltaPago}</h2>
                <p className="m-0 text-[15px] text-white/75">{m.faltaPagoTexto}</p>
                <Boton variante="primario" conFlecha disabled title={m.pagoPendiente}>
                  {m.pagar}
                </Boton>
              </section>
            )}
            <Acompanantes reserva={r} token={token} onCambio={actualizar} />
            <section className="tarjeta flex flex-col gap-3.5 p-6 md:p-8">
              <h2 className="m-0 font-display text-[26px] font-bold">{m.antesSalir}</h2>
              <Link to="/antes-de-subir">{m.queLlevar}</Link>
              <span className="text-[15px] text-tinta">
                {m.puntoEncuentro} <strong className="text-bosque">{r.puntoEncuentro ?? m.seConfirmaCorreo}</strong> · {m.salida(r.horaSalida)}
              </span>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="tarjeta flex flex-col gap-3 p-7">
              <span className="etiqueta text-tinta-suave">{m.tuGuia}</span>
              <span className="font-display text-[22px] font-bold">{r.guia ?? m.seAsigna}</span>
              {r.guia && <span className="text-sm text-tinta">{m.teEscribira}</span>}
            </div>
            {puedeCancelarse(r) && (
              <div className="flex flex-col gap-3">
                {confirmando ? (
                  <div role="alertdialog" aria-labelledby="mr-cancelar" className="flex flex-col gap-3 border-t border-error pt-4">
                    <p id="mr-cancelar" className="m-0 text-[15px]">
                      {m.cancelarPregunta}
                    </p>
                    <div className="flex gap-2">
                      <Boton variante="peligro" cargando={cancelando} onClick={cancelar}>
                        {m.siCancelar}
                      </Boton>
                      <Boton variante="secundario" onClick={() => setConfirmando(false)}>
                        {t.comun.volver}
                      </Boton>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmando(true)} className="h-12 bg-transparent font-sans text-[15px] font-semibold text-error underline underline-offset-4">
                    {m.cancelar}
                  </button>
                )}
                <span className="text-center text-[13px] leading-normal text-tinta-suave">{m.politica}</span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
