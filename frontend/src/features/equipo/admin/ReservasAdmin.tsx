import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { hoyIso, sumarDias } from '@/domain/fechas';
import { esExtranjero } from '@/domain/paises';
import type { EstadoReserva, TipoGrupo } from '@/domain/reserva';
import { es } from '@/i18n/diccionarios/es';
import type { GuiaEquipo, ReservaDelPanel } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { AreaTexto, Busqueda, CabeceraPanel, Cajon, Datos, Insignia, InsigniaEstado, Pais, Pestanas, formatoFecha, useAviso } from '../ui';

type Filtro = 'todas' | EstadoReserva;
type Procedencia = 'todas' | 'nacionales' | 'extranjeros';

const ORDEN_ESTADOS: EstadoReserva[] = ['EN_REVISION', 'PENDIENTE_PAGO', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'EXPIRADA'];
/** El backend entrega hasta 62 días por consulta. */
const MAX_DIAS = 62;

const TIPO_GRUPO: Record<TipoGrupo, string> = {
  ESTANDAR: 'Estándar',
  GRUPO_CORPORATIVO: 'Grupo corporativo',
  NECESIDAD_ESPECIAL: 'Necesidades especiales',
};

const conExtranjeros = (r: ReservaDelPanel) => r.integrantes.some((p) => esExtranjero(p.nacionalidad)) || (r.titular ? esExtranjero(r.titular.nacionalidad) : false);

const creada = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }).format(new Date(iso));

function DetalleReserva({
  reserva,
  guias,
  onCerrar,
  onCambio,
}: {
  reserva: ReservaDelPanel | null;
  guias: GuiaEquipo[];
  onCerrar: () => void;
  onCambio: () => void;
}) {
  const { operacion, reservas } = useServicios();
  const { avisar } = useAviso();
  const mensajeDeError = useMensajeError();
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const r = reserva;

  const ejecutar = async (accion: () => Promise<void>, aviso: string) => {
    setError(null);
    setOcupado(true);
    try {
      await accion();
      avisar(aviso);
      setRechazando(false);
      setMotivo('');
      onCambio();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setOcupado(false);
    }
  };

  const cerrar = () => {
    setRechazando(false);
    setMotivo('');
    setError(null);
    onCerrar();
  };

  const registrados = r ? r.integrantes.length : 0;

  return (
    <Cajon
      abierto={r !== null}
      onCerrar={cerrar}
      titulo={r ? `${r.codigo} · ${r.senderoNombre}` : ''}
      subtitulo={r ? `${formatoFecha(r.fecha)} · salida ${r.hora} · ${r.personas} personas` : undefined}
      pie={
        r && (
          <>
            {r.estado === 'EN_REVISION' && !rechazando && (
              <>
                <Boton variante="secundario" className="h-11 px-5 text-sm" disabled={ocupado} onClick={() => setRechazando(true)}>
                  Rechazar
                </Boton>
                <Boton
                  className="h-11 px-5 text-sm"
                  cargando={ocupado}
                  onClick={() => ejecutar(() => operacion.resolverRevision(r.id, true), `Reserva ${r.codigo} aprobada: el titular recibe el enlace para pagar`)}
                >
                  Aprobar
                </Boton>
              </>
            )}
            {r.titular && (
              <Boton
                variante="oscuro"
                className="h-11 px-5 text-sm"
                disabled={ocupado}
                onClick={() => ejecutar(() => reservas.solicitarEnlace(r.codigo, r.titular!.correo), `Enlace de gestión reenviado a ${r.titular!.correo}`)}
              >
                Reenviar enlace
              </Boton>
            )}
          </>
        )
      }
    >
      {r && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <InsigniaEstado estado={r.estado} />
            <Insignia tono={r.tipoGrupo === 'ESTANDAR' ? 'neutro' : 'info'}>{TIPO_GRUPO[r.tipoGrupo]}</Insignia>
            {conExtranjeros(r) && <Insignia tono="alerta">Con extranjeros · tarifa diferenciada</Insignia>}
          </div>

          {error && (
            <p role="alert" className="m-0 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}

          {rechazando && (
            <form
              aria-label="Rechazar la reserva"
              className="flex flex-col gap-4 rounded-3xl bg-superficie p-5"
              onSubmit={(e) => {
                e.preventDefault();
                void ejecutar(() => operacion.resolverRevision(r.id, false, motivo.trim() || undefined), `Reserva ${r.codigo} rechazada · cupos liberados`);
              }}
            >
              <AreaTexto etiqueta="Motivo del rechazo" valor={motivo} onCambio={setMotivo} filas={3} ayuda="Le llega al titular por correo" />
              <div className="flex flex-wrap justify-end gap-2">
                <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={() => setRechazando(false)}>
                  Volver
                </Boton>
                <Boton type="submit" variante="peligro" className="h-11 px-5 text-sm" cargando={ocupado}>
                  Rechazar y liberar cupos
                </Boton>
              </div>
            </form>
          )}

          {r.requerimientos && (
            <section className="flex flex-col gap-2 rounded-3xl bg-lima/20 p-5">
              <h3 className="m-0 font-display text-lg font-bold">Requerimientos especiales</h3>
              <p className="m-0 text-[15px]">{r.requerimientos}</p>
            </section>
          )}

          {r.titular && (
            <section className="flex flex-col gap-4">
              <h3 className="m-0 font-display text-lg font-bold">Titular</h3>
              <Datos
                filas={[
                  ['Nombre', r.titular.nombre],
                  ['Documento', `${es.persona.documentosCortos[r.titular.tipoDocumento]} ${r.titular.documento}`],
                  ['Correo', r.titular.correo],
                  ['Celular', r.titular.celular || '—'],
                  ['Creada', creada(r.creada)],
                ]}
              />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="m-0 font-display text-lg font-bold">Visitantes</h3>
              <span className="text-sm text-tinta-suave">
                {registrados} de {r.personas} registrados
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {r.integrantes.map((v) => (
                <li key={`${v.tipoDocumento}${v.documento}`} className="flex items-center justify-between gap-3 border-t linea py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Pais codigo={v.nacionalidad} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{v.nombre}</span>
                      {r.titular?.documento === v.documento && <span className="text-xs text-tinta-suave">Titular</span>}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-tinta-suave">
                    {es.persona.documentosCortos[v.tipoDocumento]} {v.documento}
                  </span>
                </li>
              ))}
              {Array.from({ length: Math.max(0, r.personas - registrados) }, (_, i) => (
                <li key={`p${i}`} className="border-t linea py-3 text-sm text-tinta-suave">
                  Acompañante pendiente de registrar
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="m-0 font-display text-lg font-bold">Guía</h3>
            {r.estado === 'CONFIRMADA' ? (
              <select
                aria-label="Guía asignado"
                value={r.guiaId ?? ''}
                disabled={ocupado}
                onChange={(e) => {
                  const guia = guias.find((g) => g.id === e.target.value);
                  if (guia) void ejecutar(() => operacion.asignarGuia(r.id, guia.id), `${guia.nombre} asignado a ${r.codigo}`);
                }}
                className="h-12 w-full rounded-2xl border border-bosque/15 bg-superficie px-4 text-[15px] focus:border-bosque focus:outline-none"
              >
                {!r.guiaId && <option value="">Sin asignar</option>}
                {guias.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <p className="m-0 text-sm text-tinta-suave">{r.guiaNombre ?? 'El guía se asigna cuando la reserva está confirmada.'}</p>
            )}
          </section>
        </div>
      )}
    </Cajon>
  );
}

/** Reservas del parque (RF-08, RF-09): búsqueda, filtros por estado y procedencia, y detalle con acciones. */
export function ReservasAdmin() {
  const { operacion } = useServicios();
  const hoy = useMemo(() => hoyIso(), []);
  const [desde, setDesde] = useState(() => sumarDias(hoy, -7));
  const [hasta, setHasta] = useState(() => sumarDias(hoy, 30));
  const rangoValido = desde <= hasta && sumarDias(desde, MAX_DIAS) >= hasta;
  const consulta = useConsulta(
    () => (rangoValido ? Promise.all([operacion.reservasDelPeriodo(desde, hasta), operacion.guias()]) : Promise.resolve(null)),
    [operacion, desde, hasta, rangoValido],
  );
  const { recargar, setEstado } = consulta;
  // Actualiza la lista sin vaciarla: el detalle abierto sigue a la vista con su estado nuevo.
  const refrescar = useCallback(() => {
    if (!rangoValido) return;
    Promise.all([operacion.reservasDelPeriodo(desde, hasta), operacion.guias()]).then(
      (nuevos) => setEstado({ tipo: 'listo', datos: nuevos }),
      () => undefined,
    );
  }, [operacion, desde, hasta, rangoValido, setEstado]);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [procedencia, setProcedencia] = useState<Procedencia>('todas');
  const [sendero, setSendero] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  // RF-08: las reservas nuevas y sus cambios de estado aparecen sin recargar la página.
  useEffect(
    () =>
      operacion.escucharEventos((e) => {
        if (e.tipo === 'reserva') refrescar();
      }),
    [operacion, refrescar],
  );

  const datos = consulta.estado.tipo === 'listo' ? consulta.estado.datos : null;
  const reservas = useMemo(() => datos?.[0] ?? [], [datos]);
  const guias = datos?.[1] ?? [];

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return reservas.filter((r) => {
      if (filtro !== 'todas' && r.estado !== filtro) return false;
      if (sendero && r.senderoId !== sendero) return false;
      const ext = conExtranjeros(r);
      if (procedencia === 'extranjeros' && !ext) return false;
      if (procedencia === 'nacionales' && ext) return false;
      return !q || [r.codigo, r.titular?.nombre ?? '', r.titular?.correo ?? '', r.titular?.documento ?? '', r.senderoNombre].some((c) => c.toLowerCase().includes(q));
    });
  }, [reservas, texto, filtro, procedencia, sendero]);

  const cuenta = (e: EstadoReserva) => reservas.filter((r) => r.estado === e).length;
  const seleccionada = reservas.find((r) => r.id === abierta) ?? null;
  const senderosConReservas = [...new Map(reservas.map((r) => [r.senderoId, r.senderoNombre])).entries()];

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Administración" titulo="Reservas" fotoId="lagunas-de-siecha">
        <dl className="m-0 flex gap-8">
          {[
            ['en revisión', cuenta('EN_REVISION')],
            ['por pagar', cuenta('PENDIENTE_PAGO')],
            ['confirmadas', cuenta('CONFIRMADA')],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col-reverse gap-1">
              <dt className="text-[13px] text-white/70">{k}</dt>
              <dd className="m-0 font-cifras text-[28px] font-black">{v}</dd>
            </div>
          ))}
        </dl>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <Campo className="w-44" etiqueta="Tours desde" type="date" value={desde} onChange={(e) => e.target.value && setDesde(e.target.value)} />
          <Campo className="w-44" etiqueta="Hasta" type="date" value={hasta} onChange={(e) => e.target.value && setHasta(e.target.value)} />
          {!rangoValido && <span className="pb-2 text-sm text-error">El rango va de 1 a {MAX_DIAS} días.</span>}
        </div>
        <Pestanas
          etiqueta="Estado"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[
            { valor: 'todas' as Filtro, texto: 'Todas', cuenta: reservas.length },
            ...ORDEN_ESTADOS.map((e) => ({ valor: e as Filtro, texto: es.estados[e], cuenta: cuenta(e) })),
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar reserva" placeholder="Código, titular, correo o documento" />
          <select
            aria-label="Procedencia"
            value={procedencia}
            onChange={(e) => setProcedencia(e.target.value as Procedencia)}
            className="h-11 rounded-full border border-bosque/15 bg-superficie px-4 text-sm font-semibold focus:border-bosque focus:outline-none"
          >
            <option value="todas">Todas las procedencias</option>
            <option value="nacionales">Solo nacionales</option>
            <option value="extranjeros">Con extranjeros</option>
          </select>
          <select
            aria-label="Sendero"
            value={sendero}
            onChange={(e) => setSendero(e.target.value)}
            className="h-11 max-w-full rounded-full border border-bosque/15 bg-superficie px-4 text-sm font-semibold focus:border-bosque focus:outline-none"
          >
            <option value="">Todos los senderos</option>
            {senderosConReservas.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {consulta.estado.tipo === 'cargando' && <Cargando texto="Cargando reservas…" />}
      {consulta.estado.tipo === 'error' && <ErrorCarga mensaje={consulta.estado.mensaje} reintentar={recargar} />}

      {datos && (
        <section aria-label="Lista de reservas" className="tarjeta overflow-hidden">
          <div className="hidden grid-cols-[130px_minmax(0,1.5fr)_minmax(0,1.1fr)_120px_90px_140px] gap-4 border-b linea px-5 py-3 font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase lg:grid">
            <span>Código</span>
            <span>Titular</span>
            <span>Sendero</span>
            <span>Fecha</span>
            <span>Personas</span>
            <span>Estado</span>
          </div>
          {visibles.length === 0 && <p className="m-0 px-5 py-10 text-center text-tinta-suave">No hay reservas con esos filtros en el rango elegido.</p>}
          <ul className="m-0 list-none p-0">
            {visibles.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <button
                  type="button"
                  onClick={() => setAbierta(r.id)}
                  aria-label={`Ver reserva ${r.codigo}`}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b linea px-5 py-4 text-left transition-colors last:border-0 hover:bg-arena/60 lg:grid-cols-[130px_minmax(0,1.5fr)_minmax(0,1.1fr)_120px_90px_140px]"
                >
                  <span className="font-mono text-sm font-bold">{r.codigo}</span>
                  <span className="flex min-w-0 items-center gap-2 max-lg:order-3 max-lg:col-span-2">
                    {r.titular && <Pais codigo={r.titular.nacionalidad} />}
                    <span className="truncate font-semibold">{r.titular?.nombre ?? '—'}</span>
                  </span>
                  <span className="truncate text-[15px] max-lg:order-4 max-lg:col-span-2 max-lg:text-sm max-lg:text-tinta-suave">{r.senderoNombre}</span>
                  <span className="font-mono text-sm max-lg:hidden">{formatoFecha(r.fecha)}</span>
                  <span className="font-mono text-sm max-lg:hidden">{r.personas}</span>
                  <span className="max-lg:order-2 max-lg:row-start-1 max-lg:justify-self-end">
                    <InsigniaEstado estado={r.estado} />
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      <DetalleReserva reserva={seleccionada} guias={guias} onCerrar={() => setAbierta(null)} onCambio={refrescar} />
    </div>
  );
}
