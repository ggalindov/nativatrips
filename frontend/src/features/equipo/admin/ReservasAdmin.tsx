import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { esExtranjero } from '@/domain/paises';
import type { EstadoReserva } from '@/domain/reserva';
import { extranjerosEn } from '@/domain/reserva';
import { es } from '@/i18n/diccionarios/es';
import { SENDEROS } from '@/services/memoria/datos';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { GUIAS, RESERVAS, nombreSendero } from '../ejemplo';
import type { ReservaEjemplo } from '../ejemplo';
import { AreaTexto, Busqueda, CabeceraPanel, Cajon, Datos, Insignia, InsigniaEstado, Pais, Pestanas, formatoFecha, formatoPesos, useAviso } from '../ui';

type Filtro = 'todas' | EstadoReserva;
type Procedencia = 'todas' | 'nacionales' | 'extranjeros';

const ORDEN_ESTADOS: EstadoReserva[] = ['EN_REVISION', 'PENDIENTE_PAGO', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'EXPIRADA'];

/** Corrección de los datos de una reserva por parte del administrador. */
function EditarReserva({
  reserva,
  onGuardar,
  onCancelar,
}: {
  reserva: ReservaEjemplo;
  onGuardar: (cambios: Partial<ReservaEjemplo>) => void;
  onCancelar: () => void;
}) {
  const [b, setB] = useState(reserva);
  const titular = (campo: 'nombre' | 'correo' | 'celular', valor: string) => setB({ ...b, titular: { ...b.titular, [campo]: valor } });
  return (
    <form
      aria-label="Editar datos de la reserva"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({ senderoId: b.senderoId, fecha: b.fecha, hora: b.hora, personas: b.personas, titular: b.titular, nota: b.nota?.trim() || undefined });
      }}
      className="flex flex-col gap-5 rounded-3xl bg-superficie p-5"
    >
      <h3 className="m-0 font-display text-lg font-bold">Editar datos</h3>
      <Selector
        etiqueta="Recorrido"
        value={b.senderoId}
        onChange={(e) => setB({ ...b, senderoId: e.target.value })}
        opciones={SENDEROS.map((x) => ({ valor: x.id, texto: x.nombre }))}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Campo className="col-span-2 sm:col-span-1" etiqueta="Fecha" type="date" value={b.fecha} onChange={(e) => setB({ ...b, fecha: e.target.value })} />
        <Campo etiqueta="Hora" type="time" value={b.hora} onChange={(e) => setB({ ...b, hora: e.target.value })} />
        <Campo
          etiqueta="Personas"
          type="number"
          min={1}
          max={30}
          value={b.personas}
          onChange={(e) => setB({ ...b, personas: Math.max(1, Number(e.target.value)) })}
        />
      </div>
      <Campo etiqueta="Nombre del titular" value={b.titular.nombre} onChange={(e) => titular('nombre', e.target.value)} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <Campo etiqueta="Correo" type="email" value={b.titular.correo} onChange={(e) => titular('correo', e.target.value)} />
        <Campo etiqueta="Celular" type="tel" value={b.titular.celular} onChange={(e) => titular('celular', e.target.value)} />
      </div>
      <AreaTexto etiqueta="Nota interna" valor={b.nota ?? ''} onCambio={(v) => setB({ ...b, nota: v })} filas={2} ayuda="Solo la ve el equipo" />
      <p className="m-0 text-sm text-tinta-suave">El titular recibe un correo con los datos actualizados.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={onCancelar}>
          Descartar
        </Boton>
        <Boton type="submit" className="h-11 px-5 text-sm">
          Guardar datos
        </Boton>
      </div>
    </form>
  );
}

function DetalleReserva({ reserva, onCerrar, onCambio }: { reserva: ReservaEjemplo | null; onCerrar: () => void; onCambio: (r: ReservaEjemplo) => void }) {
  const { avisar } = useAviso();
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [editando, setEditando] = useState(false);
  const r = reserva;
  const visitantes = r ? [{ ...r.titular, titular: true }, ...r.acompanantes.map((a) => ({ ...a, titular: false }))] : [];
  const actualizar = (cambios: Partial<ReservaEjemplo>, aviso: string) => {
    if (!r) return;
    onCambio({ ...r, ...cambios, historial: [...r.historial, { fecha: 'ahora', texto: aviso }] });
    avisar(aviso);
  };

  return (
    <Cajon
      abierto={r !== null}
      onCerrar={() => {
        setConfirmarCancelar(false);
        setEditando(false);
        onCerrar();
      }}
      titulo={r ? `${r.codigo} · ${nombreSendero(r.senderoId)}` : ''}
      subtitulo={r ? `${formatoFecha(r.fecha)} · salida ${r.hora} · ${r.personas} personas` : undefined}
      pie={
        r && (
          <>
            {r.estado === 'EN_REVISION' && (
              <>
                <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={() => actualizar({ estado: 'CANCELADA' }, `Reserva ${r.codigo} rechazada`)}>
                  Rechazar
                </Boton>
                <Boton className="h-11 px-5 text-sm" onClick={() => actualizar({ estado: 'CONFIRMADA' }, `Reserva ${r.codigo} confirmada`)}>
                  Aprobar
                </Boton>
              </>
            )}
            {(r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE_PAGO') &&
              (confirmarCancelar ? (
                <Boton
                  variante="peligro"
                  className="h-11 px-5 text-sm"
                  onClick={() => actualizar({ estado: 'CANCELADA' }, `Reserva ${r.codigo} cancelada · cupos liberados`)}
                >
                  Sí, cancelar y liberar cupos
                </Boton>
              ) : (
                <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={() => setConfirmarCancelar(true)}>
                  Cancelar reserva
                </Boton>
              ))}
            <Boton variante="oscuro" className="h-11 px-5 text-sm" onClick={() => avisar(`Enlace de gestión reenviado a ${r.titular.correo}`)}>
              Reenviar enlace
            </Boton>
          </>
        )
      }
    >
      {r && (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <InsigniaEstado estado={r.estado} />
            {extranjerosEn(r) > 0 && (
              <Insignia tono="alerta">
                {extranjerosEn(r)} extranjero{extranjerosEn(r) === 1 ? '' : 's'} · tarifa diferenciada
              </Insignia>
            )}
            {r.nota && <Insignia tono="info">{r.nota}</Insignia>}
          </div>

          {editando ? (
            <EditarReserva
              key={r.codigo}
              reserva={r}
              onCancelar={() => setEditando(false)}
              onGuardar={(cambios) => {
                actualizar(cambios, `Datos de ${r.codigo} actualizados`);
                setEditando(false);
              }}
            />
          ) : (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 font-display text-lg font-bold">Titular</h3>
                <button type="button" onClick={() => setEditando(true)} className="min-h-11 bg-transparent px-1 text-sm font-semibold text-pino underline">
                  Editar datos
                </button>
              </div>
              <Datos
                filas={[
                  ['Nombre', r.titular.nombre],
                  ['Documento', `${es.persona.documentosCortos[r.titular.tipoDocumento]} ${r.titular.documento}`],
                  ['Correo', r.titular.correo],
                  ['Celular', r.titular.celular],
                  ['Total', formatoPesos(r.total)],
                  ['Creada', r.creada],
                ]}
              />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="m-0 font-display text-lg font-bold">Visitantes</h3>
              <span className="text-sm text-tinta-suave">
                {visitantes.length} de {r.personas} registrados
              </span>
            </div>
            <ul className="m-0 list-none p-0">
              {visitantes.map((v) => (
                <li key={v.documento} className="flex items-center justify-between gap-3 border-t linea py-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <Pais codigo={v.nacionalidad} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{v.nombre}</span>
                      {v.titular && <span className="text-xs text-tinta-suave">Titular</span>}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-tinta-suave">
                    {es.persona.documentosCortos[v.tipoDocumento]} {v.documento}
                  </span>
                </li>
              ))}
              {Array.from({ length: Math.max(0, r.personas - visitantes.length) }, (_, i) => (
                <li key={`p${i}`} className="border-t linea py-3 text-sm text-tinta-suave">
                  Acompañante pendiente de registrar
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="m-0 font-display text-lg font-bold">Guía</h3>
            <select
              aria-label="Guía asignado"
              value={r.guiaId ?? ''}
              onChange={(e) =>
                actualizar(
                  { guiaId: e.target.value || null },
                  e.target.value ? `Guía asignado: ${GUIAS.find((g) => g.id === e.target.value)?.nombre}` : 'Guía sin asignar',
                )
              }
              className="h-12 w-full rounded-2xl border border-bosque/15 bg-superficie px-4 text-[15px] focus:border-bosque focus:outline-none"
            >
              <option value="">Sin asignar</option>
              {GUIAS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} · {g.idiomas.join(', ')}
                </option>
              ))}
            </select>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="m-0 font-display text-lg font-bold">Pagos</h3>
            {r.pagos.length === 0 ? (
              <p className="m-0 text-sm text-tinta-suave">Sin intentos de pago.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {r.pagos.map((pago, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t linea py-3 text-sm">
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {pago.medio} · {formatoPesos(pago.valor)}
                      </span>
                      <span className="text-xs text-tinta-suave">
                        {pago.fecha} · intento {i + 1} de 2
                      </span>
                    </span>
                    <Insignia tono={pago.estado === 'Aprobado' ? 'exito' : pago.estado === 'Rechazado' ? 'peligro' : 'alerta'}>{pago.estado}</Insignia>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="m-0 font-display text-lg font-bold">Historial</h3>
            <ol className="m-0 flex list-none flex-col gap-0 border-l-2 border-bosque/15 p-0 pl-5">
              {r.historial.map((h, i) => (
                <li key={i} className="relative pb-4 last:pb-0">
                  <span aria-hidden="true" className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-arena bg-pino" />
                  <span className="block text-sm">{h.texto}</span>
                  <span className="font-mono text-xs text-tinta-suave">{h.fecha}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Cajon>
  );
}

/** Reservas del parque: búsqueda, filtros por estado y procedencia, y detalle con acciones. */
export function ReservasAdmin() {
  const [reservas, setReservas] = useState(RESERVAS);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [procedencia, setProcedencia] = useState<Procedencia>('todas');
  const [sendero, setSendero] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return reservas.filter((r) => {
      if (filtro !== 'todas' && r.estado !== filtro) return false;
      if (sendero && r.senderoId !== sendero) return false;
      const ext = extranjerosEn(r) > 0 || esExtranjero(r.titular.nacionalidad);
      if (procedencia === 'extranjeros' && !ext) return false;
      if (procedencia === 'nacionales' && ext) return false;
      return !q || [r.codigo, r.titular.nombre, r.titular.correo, r.titular.documento, nombreSendero(r.senderoId)].some((c) => c.toLowerCase().includes(q));
    });
  }, [reservas, texto, filtro, procedencia, sendero]);

  const cuenta = (e: EstadoReserva) => reservas.filter((r) => r.estado === e).length;
  const seleccionada = reservas.find((r) => r.codigo === abierta) ?? null;
  const senderosConReservas = [...new Set(reservas.map((r) => r.senderoId))];

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
            {senderosConReservas.map((id) => (
              <option key={id} value={id}>
                {nombreSendero(id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section aria-label="Lista de reservas" className="tarjeta overflow-hidden">
        <div className="hidden grid-cols-[110px_minmax(0,1.5fr)_minmax(0,1.1fr)_120px_90px_140px] gap-4 border-b linea px-5 py-3 font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase lg:grid">
          <span>Código</span>
          <span>Titular</span>
          <span>Sendero</span>
          <span>Fecha</span>
          <span>Personas</span>
          <span>Estado</span>
        </div>
        {visibles.length === 0 && <p className="m-0 px-5 py-10 text-center text-tinta-suave">No hay reservas con esos filtros.</p>}
        <ul className="m-0 list-none p-0">
          {visibles.map((r, i) => (
            <motion.li key={r.codigo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
              <button
                type="button"
                onClick={() => setAbierta(r.codigo)}
                aria-label={`Ver reserva ${r.codigo}`}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b linea px-5 py-4 text-left transition-colors last:border-0 hover:bg-arena/60 lg:grid-cols-[110px_minmax(0,1.5fr)_minmax(0,1.1fr)_120px_90px_140px]"
              >
                <span className="font-mono text-sm font-bold">{r.codigo}</span>
                <span className="flex min-w-0 items-center gap-2 max-lg:order-3 max-lg:col-span-2">
                  <Pais codigo={r.titular.nacionalidad} />
                  <span className="truncate font-semibold">{r.titular.nombre}</span>
                </span>
                <span className="truncate text-[15px] max-lg:order-4 max-lg:col-span-2 max-lg:text-sm max-lg:text-tinta-suave">
                  {nombreSendero(r.senderoId)}
                </span>
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

      <DetalleReserva
        reserva={seleccionada}
        onCerrar={() => setAbierta(null)}
        onCambio={(nueva) => setReservas((rs) => rs.map((x) => (x.codigo === nueva.codigo ? nueva : x)))}
      />
    </div>
  );
}
