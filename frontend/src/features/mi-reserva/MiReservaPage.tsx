import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { atributosFoto, fotoDeSendero } from '@/contenido/fotos';
import { hoyIso, sumarDias } from '@/domain/fechas';
import { bandera, esExtranjero } from '@/domain/paises';
import type { CausalReprogramacion, ErrorValidacion, Persona, Reserva } from '@/domain/reserva';
import {
  CAUSALES,
  PERSONA_VACIA,
  SOPORTE_MAXIMO_BYTES,
  SOPORTE_TIPOS,
  acompanantesPendientes,
  admiteCambios,
  pasosRecorrido,
  puedeReprogramarse,
  validarPersona,
} from '@/domain/reserva';
import { claveDeSendero } from '@/domain/sendero';
import { AvisoExtranjeros, CamposPersona } from '@/features/reservas/CamposPersona';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { AreaTexto } from '@/ui/AreaTexto';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
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
        admiteCambios(reserva) && (
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

/** RF-37 (Anexo 16): pedir otra fecha con una causal y su soporte; la reserva queda en revisión. */
function Reprogramar({ reserva, token, onCambio }: { reserva: Reserva; token: string; onCambio: (r: Reserva) => void }) {
  const { reservas } = useServicios();
  const { t } = useIdioma();
  const mensajeDeError = useMensajeError();
  const m = t.miReserva;
  const manana = sumarDias(hoyIso(), 1);
  const [abierto, setAbierto] = useState(false);
  const [causal, setCausal] = useState<CausalReprogramacion>('INCAPACIDAD_MEDICA');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [soporte, setSoporte] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!descripcion.trim() || !fecha || fecha === reserva.fecha || !soporte) {
      setError(m.faltanDatos);
      return;
    }
    if (soporte.size > SOPORTE_MAXIMO_BYTES) {
      setError(m.soporteGrande);
      return;
    }
    setEnviando(true);
    try {
      onCambio(await reservas.solicitarReprogramacion(token, { causal, descripcion, fechaDeseada: fecha, soporte }));
      setAbierto(false);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="mr-reprogramar" className="tarjeta flex flex-col gap-4 p-6 md:p-8">
      <h2 id="mr-reprogramar" className="m-0 font-display text-[26px] font-bold">
        {m.reprogramar}
      </h2>
      <p className="m-0 text-[15px] leading-relaxed text-tinta">{m.reprogramarTexto}</p>
      {!abierto ? (
        <div>
          <Boton variante="secundario" onClick={() => setAbierto(true)}>
            {m.reprogramar}
          </Boton>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5 border-t linea pt-5">
          <Selector
            etiqueta={m.causal}
            value={causal}
            onChange={(e) => setCausal(e.target.value as CausalReprogramacion)}
            opciones={CAUSALES.map((c) => ({ valor: c, texto: m.causales[c] }))}
            ayuda={m.soportesCausal[causal]}
          />
          <AreaTexto etiqueta={m.queOcurrio} valor={descripcion} onCambio={setDescripcion} filas={3} maximo={1000} />
          <Campo etiqueta={m.fechaNueva} type="date" min={manana} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <Campo
            etiqueta={m.soporte}
            type="file"
            accept={SOPORTE_TIPOS}
            ayuda={m.soporteAyuda}
            onChange={(e) => setSoporte(e.target.files?.[0] ?? null)}
            className="[&_input]:h-auto [&_input]:py-3"
          />
          {error && (
            <p role="alert" className="m-0 text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Boton type="submit" cargando={enviando}>
              {m.enviarSolicitud}
            </Boton>
            <Boton variante="secundario" onClick={() => setAbierto(false)}>
              {t.comun.volver}
            </Boton>
          </div>
        </form>
      )}
      <span className="text-[13px] leading-normal text-tinta-suave">{m.sinCausal}</span>
    </section>
  );
}

/** Guarda el enlace antes de ir a Wompi: la página de regreso lo usa para volver a esta reserva. */
export const CLAVE_PAGO = 'nativatrips.pago-enlace';
/** Mientras Wompi confirma, la reserva se vuelve a consultar cada tanto, hasta este límite. */
const CONSULTA_PAGO_MS = 5000;
const ESPERA_PAGO_MS = 3 * 60_000;

/** Lleva al checkout de Wompi; la reserva se confirma solo cuando llega el evento firmado de Wompi. */
function Pagar({ token }: { token: string }) {
  const { reservas } = useServicios();
  const { t } = useIdioma();
  const mensajeDeError = useMensajeError();
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pagar = async () => {
    setError(null);
    setYendo(true);
    try {
      const url = await reservas.iniciarPago(token);
      try {
        sessionStorage.setItem(CLAVE_PAGO, token);
      } catch {
        /* sin almacenamiento: al volver se abre la reserva desde el correo */
      }
      window.location.assign(url);
    } catch (e) {
      setError(mensajeDeError(e));
      setYendo(false);
    }
  };

  return (
    <>
      <Boton variante="primario" conFlecha cargando={yendo} onClick={pagar} title={t.miReserva.pagoPendiente}>
        {t.miReserva.pagar}
      </Boton>
      {error && (
        <p role="alert" className="m-0 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white">
          {error}
        </p>
      )}
    </>
  );
}

function enlaceDelPago(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_PAGO);
  } catch {
    return null;
  }
}

/** Regreso desde Wompi: la URL de regreso no confirma nada, así que solo devuelve a la reserva. */
export function ResultadoPagoPage() {
  const { t } = useIdioma();
  const token = enlaceDelPago();
  if (token) return <Navigate to={`/mi-reserva/${token}?pago=regreso`} replace />;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-20">
      <p role="status" className="m-0 text-[17px] leading-relaxed">
        {t.miReserva.pagoSinEnlace}
      </p>
      <Link to="/mi-reserva">{t.miReserva.pedirNuevo}</Link>
    </div>
  );
}

export function MiReservaPage() {
  const { token = '' } = useParams();
  const [parametros] = useSearchParams();
  const regresoDePago = parametros.get('pago') === 'regreso';
  const { reservas } = useServicios();
  const { t, f } = useIdioma();
  const m = t.miReserva;
  const { estado, setEstado, recargar } = useConsulta(() => reservas.abrirConEnlace(token), [reservas, token]);
  const pendiente = estado.tipo === 'listo' && estado.datos.estado === 'PENDIENTE_PAGO';

  // Al volver de Wompi la confirmación llega por el evento del servidor, no por el navegador: se consulta hasta verla.
  useEffect(() => {
    if (!regresoDePago || !pendiente) return;
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      if (Date.now() - inicio > ESPERA_PAGO_MS) {
        clearInterval(intervalo);
        return;
      }
      reservas.abrirConEnlace(token).then(
        (nueva) => nueva.estado !== 'PENDIENTE_PAGO' && setEstado({ tipo: 'listo', datos: nueva }),
        () => undefined,
      );
    }, CONSULTA_PAGO_MS);
    return () => clearInterval(intervalo);
  }, [regresoDePago, pendiente, reservas, token, setEstado]);

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
  return (
    <>
      <section className="relative isolate h-56 overflow-hidden bg-bosque md:h-72" aria-hidden="true">
        <FotoAnimada {...atributosFoto(fotoDeSendero(claveDeSendero(r.senderoNombre)))} alt="" kenBurns prioridad />
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
                {regresoDePago && (
                  <p role="status" className="m-0 rounded-2xl bg-lima/15 px-4 py-3 text-[15px] text-white">
                    {m.pagoEnProceso}
                  </p>
                )}
                <Pagar token={token} />
              </section>
            )}
            {r.estado === 'EN_REVISION' && !r.reprogramacion && (
              <p role="status" className="m-0 rounded-[28px] bg-lima/30 p-6 text-[15px] text-bosque">
                {m.enRevisionGrupo}
              </p>
            )}
            <Acompanantes reserva={r} token={token} onCambio={actualizar} />
            {r.requerimientos && (
              <section className="tarjeta flex flex-col gap-2 p-6 md:p-8">
                <h2 className="m-0 font-display text-[22px] font-bold">{m.requerimientos}</h2>
                <span className="text-sm text-tinta-suave">{m.grupo}: {t.reserva.tiposGrupo[r.tipoGrupo]}</span>
                <p className="m-0 text-[15px] text-tinta">{r.requerimientos}</p>
              </section>
            )}
            {puedeReprogramarse(r, hoyIso()) && <Reprogramar reserva={r} token={token} onCambio={actualizar} />}
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
            {r.reprogramacion && (
              <div role="status" className="rounded-3xl border border-bosque/15 bg-superficie p-5 text-[15px] leading-relaxed">
                {m.reprogramacion[r.reprogramacion.estado](f.fecha(r.reprogramacion.fechaDeseada))}
                {r.reprogramacion.motivo && <span className="mt-2 block text-sm text-tinta-suave">{r.reprogramacion.motivo}</span>}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
