import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatearFecha } from '@/domain/fechas';
import type { Reserva } from '@/domain/reserva';
import { ETIQUETA_ESTADO, acompanantesPendientes, pasosRecorrido, puedeCancelarse } from '@/domain/reserva';
import { useServicios } from '@/services/ServiciosContext';
import { mensajeDeError, useConsulta } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { fotoDeSendero } from '@/contenido/fotos';
import { FotoAnimada } from '@/ui/movimiento';

function Acompanantes({ reserva, token, onCambio }: { reserva: Reserva; token: string; onCambio: (r: Reserva) => void }) {
  const { reservas } = useServicios();
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const pendientes = acompanantesPendientes(reserva);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      onCambio(await reservas.agregarAcompanante(token, { nombre, documento }));
      setNombre('');
      setDocumento('');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section aria-labelledby="mr-acomp" className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4 border-t linea pt-5">
        <h2 id="mr-acomp" className="m-0 font-display text-[26px] font-bold">
          Acompañantes
        </h2>
        <span className="font-mono text-[13px] text-tinta-suave">
          {pendientes === 0 ? 'Completo' : `${pendientes} pendiente${pendientes === 1 ? '' : 's'}`}
        </span>
      </div>
      {reserva.personas === 1 ? (
        <p className="m-0 text-[15px] text-tinta">Reservaste para una sola persona.</p>
      ) : (
        <>
          <p className="m-0 text-[15px] leading-relaxed text-tinta">El parque exige nombre y documento de cada visitante.</p>
          {reserva.acompanantes.length > 0 && (
            <ul className="m-0 flex list-none flex-col p-0">
              {reserva.acompanantes.map((a) => (
                <li key={a.documento} className="flex justify-between gap-4 border-t linea py-3 text-[15px]">
                  <span>{a.nombre}</span>
                  <span className="font-mono text-tinta-suave">{a.documento}</span>
                </li>
              ))}
            </ul>
          )}
          {pendientes > 0 && puedeCancelarse(reserva) && (
            <form onSubmit={guardar} className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo etiqueta="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <Campo etiqueta="Documento" inputMode="numeric" value={documento} onChange={(e) => setDocumento(e.target.value)} />
              </div>
              {error && (
                <p role="alert" className="m-0 text-sm text-error">
                  {error}
                </p>
              )}
              <div>
                <Boton type="submit" cargando={guardando}>
                  Guardar acompañante
                </Boton>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

export function MiReservaPage() {
  const { token = '' } = useParams();
  const { reservas } = useServicios();
  const { estado, setEstado, recargar } = useConsulta(() => reservas.abrirConEnlace(token), [reservas, token]);
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  if (estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-6 py-20"><Cargando texto="Abriendo tu reserva…" /></div>;
  if (estado.tipo === 'error') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-20">
        <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />
        <Link to="/mi-reserva">Pedir un enlace nuevo →</Link>
      </div>
    );
  }

  const r = estado.datos;
  const actualizar = (nueva: Reserva) => setEstado({ tipo: 'listo', datos: nueva });
  const cancelar = async () => {
    setCancelando(true);
    try {
      actualizar(await reservas.cancelar(token));
    } catch (err) {
      setEstado({ tipo: 'error', mensaje: mensajeDeError(err) });
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
          <span className="font-mono text-[13px] text-tinta-suave">Reserva {r.codigo}</span>
          <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight md:text-[56px]">{r.senderoNombre}</h1>
          <span className="font-mono text-[15px]">
            {formatearFecha(r.fecha)} · {r.horaSalida} · {r.personas} {r.personas === 1 ? 'persona' : 'personas'}
          </span>
        </div>
        <span className="inline-flex h-10 items-center gap-2.5 rounded-full bg-bosque px-4 font-mono text-[13px] tracking-[0.08em] text-arena uppercase">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-lima" />
          {ETIQUETA_ESTADO[r.estado]}
        </span>
      </div>

      {r.estado !== 'CANCELADA' && r.estado !== 'EXPIRADA' && (
        <ol aria-label="Estado de la reserva" className="m-0 grid list-none gap-2 p-0 sm:grid-cols-4">
          {pasosRecorrido(r.estado).map((p) => (
            <li
              key={p.estado}
              aria-current={p.paso === 'actual' ? 'step' : undefined}
              className={`flex flex-col gap-1 border-t-[3px] pt-3.5 ${
                p.paso === 'actual' ? 'border-lima' : p.paso === 'hecho' ? 'border-bosque' : 'border-bosque/20 text-tinta-suave'
              }`}
            >
              <span className="font-semibold">{ETIQUETA_ESTADO[p.estado]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-12">
          {r.estado === 'PENDIENTE_PAGO' && (
            <section className="flex flex-col items-start gap-4 border-t linea pt-5">
              <h2 className="m-0 font-display text-[26px] font-bold">Falta el pago</h2>
              <p className="m-0 text-[15px] text-tinta">Completa el pago para que revisemos y confirmemos la reserva.</p>
              <Boton variante="primario" conFlecha disabled title="Se conecta con PayU en la integración con el backend">
                Pagar con PayU
              </Boton>
            </section>
          )}
          <Acompanantes reserva={r} token={token} onCambio={actualizar} />
          <section className="flex flex-col gap-3.5 border-t linea pt-5">
            <h2 className="m-0 font-display text-[26px] font-bold">Antes de salir</h2>
            <a href="/#antes">Qué llevar y normas del parque →</a>
            <span className="text-[15px] text-tinta">Punto de encuentro: [DIRECCIÓN]</span>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="tarjeta flex flex-col gap-3 p-7">
            <span className="etiqueta text-tinta-suave">Tu guía</span>
            <span className="font-display text-[22px] font-bold">{r.guia ?? 'Se asigna al confirmar'}</span>
            {r.guia && <span className="text-sm text-tinta">Te escribirá el día anterior.</span>}
          </div>
          {puedeCancelarse(r) && (
            <div className="flex flex-col gap-3">
              {confirmando ? (
                <div role="alertdialog" aria-labelledby="mr-cancelar" className="flex flex-col gap-3 border-t border-error pt-4">
                  <p id="mr-cancelar" className="m-0 text-[15px]">¿Cancelar la reserva? Los cupos se liberan para otras personas.</p>
                  <div className="flex gap-2">
                    <Boton variante="peligro" cargando={cancelando} onClick={cancelar}>
                      Sí, cancelar
                    </Boton>
                    <Boton variante="secundario" onClick={() => setConfirmando(false)}>
                      Volver
                    </Boton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  className="h-12 bg-transparent font-sans text-[15px] font-semibold text-error underline underline-offset-4"
                >
                  Cancelar reserva
                </button>
              )}
              <span className="text-center text-[13px] leading-normal text-tinta-suave">Política de cancelación: [CONDICIONES Y PLAZOS]</span>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  );
}
