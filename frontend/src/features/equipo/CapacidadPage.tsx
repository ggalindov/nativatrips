import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { hoyIso, sumarDias } from '@/domain/fechas';
import type { CapacidadDia, SenderoAdmin } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { CabeceraPanel, Insignia, Pestanas, TituloSeccion, formatoFecha, useAviso } from './ui';

const UMBRAL_POR_DEFECTO = 80;
/** Semanas que se ofrecen: la actual y las tres siguientes (la capacidad se carga con una semana de antelación). */
const SEMANAS = 4;

/** Lunes de la semana de una fecha: la semana de operación va de lunes a domingo. */
function lunesDe(iso: string): string {
  const dia = new Date(`${iso}T12:00:00`).getDay();
  return sumarDias(iso, -((dia + 6) % 7));
}

const DIAS_SEMANA = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

interface Fila {
  /** Cupo escrito por día, en el orden de la semana; vacío = sin publicar. */
  cupos: string[];
  umbral: string;
}

const porcentaje = (d: Pick<CapacidadDia, 'ocupacion' | 'cupoMaximo'>) => (d.cupoMaximo > 0 ? Math.round((d.ocupacion / d.cupoMaximo) * 100) : 0);

function filaInicial(senderoId: string, dias: string[], publicados: Map<string, CapacidadDia>): Fila {
  const propios = dias.map((d) => publicados.get(`${senderoId}|${d}`));
  return {
    cupos: propios.map((c) => (c ? String(c.cupoMaximo) : '')),
    umbral: String(propios.find(Boolean)?.umbralPct ?? UMBRAL_POR_DEFECTO),
  };
}

/** Una fila del sendero: cupo de cada día, ocupación y umbral de alerta. */
function FilaSendero({
  sendero,
  dias,
  publicados,
  onGuardado,
}: {
  sendero: SenderoAdmin;
  dias: string[];
  publicados: Map<string, CapacidadDia>;
  onGuardado: () => void;
}) {
  const { operacion } = useServicios();
  const { avisar } = useAviso();
  const mensajeDeError = useMensajeError();
  const inicial = useMemo(() => filaInicial(sendero.id, dias, publicados), [sendero.id, dias, publicados]);
  const [fila, setFila] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setFila(inicial), [inicial]);

  const cambiada = fila.umbral !== inicial.umbral || fila.cupos.some((c, i) => c !== inicial.cupos[i]);
  const umbral = Number(fila.umbral);
  const umbralValido = Number.isInteger(umbral) && umbral >= 1 && umbral <= 100;
  const cupoValido = (c: string) => c === '' || (Number.isInteger(Number(c)) && Number(c) >= 1);
  // Un día ya publicado no se puede despublicar desde aquí: el backend solo carga o corrige cupos.
  const borraPublicado = fila.cupos.some((c, i) => c === '' && inicial.cupos[i] !== '');
  const valida = umbralValido && fila.cupos.every(cupoValido) && !borraPublicado;

  const cambiarCupo = (i: number, valor: string) => setFila((f) => ({ ...f, cupos: f.cupos.map((c, j) => (j === i ? valor.replace(/\D/g, '') : c)) }));
  const repetir = () => {
    const primero = fila.cupos.find((c) => c !== '');
    if (primero) setFila((f) => ({ ...f, cupos: f.cupos.map(() => primero) }));
  };

  const guardar = async () => {
    setError(null);
    setGuardando(true);
    try {
      const cargar = dias
        .map((fecha, i) => ({ fecha, cupoMaximo: Number(fila.cupos[i]), umbralPct: umbral }))
        .filter((_, i) => fila.cupos[i] !== '');
      await operacion.cargarCapacidad(sendero.id, cargar);
      avisar(`Capacidad de ${sendero.nombre} guardada: ${cargar.length} día${cargar.length === 1 ? '' : 's'}`);
      onGuardado();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <tr className="border-t linea align-top">
      <th scope="row" className="px-5 py-3 text-left font-semibold">
        <span className="flex flex-col gap-1">
          {sendero.nombre}
          {!sendero.publicado && <span className="text-xs font-normal text-tinta-suave">En borrador</span>}
          {error && (
            <span role="alert" className="max-w-[220px] text-xs font-normal text-error">
              {error}
            </span>
          )}
          {borraPublicado && <span className="max-w-[220px] text-xs font-normal text-error">Un día publicado necesita un cupo de 1 o más.</span>}
        </span>
      </th>
      {dias.map((fecha, i) => {
        const dia = publicados.get(`${sendero.id}|${fecha}`);
        const pct = dia ? porcentaje(dia) : 0;
        const alerta = dia ? pct >= dia.umbralPct : false;
        return (
          <td key={fecha} className="px-1.5 py-3">
            <div className="flex flex-col items-center gap-1">
              <input
                inputMode="numeric"
                aria-label={`Cupo de ${sendero.nombre} el ${formatoFecha(fecha)}`}
                value={fila.cupos[i]}
                placeholder="—"
                onChange={(e) => cambiarCupo(i, e.target.value)}
                disabled={fecha < hoyIso()}
                className={`h-10 w-16 rounded-xl border bg-superficie text-center font-mono text-sm focus:border-bosque focus:outline-none disabled:opacity-50 ${
                  cupoValido(fila.cupos[i]) ? 'border-bosque/15' : 'border-error'
                }`}
              />
              {dia && (
                <span className={`font-mono text-[11px] ${alerta ? 'font-bold text-advertencia' : 'text-tinta-suave'}`} title={`${dia.ocupacion} de ${dia.cupoMaximo} reservados`}>
                  {dia.ocupacion}/{dia.cupoMaximo}
                </span>
              )}
            </div>
          </td>
        );
      })}
      <td className="px-1.5 py-3">
        <div className="flex items-center gap-1">
          <input
            inputMode="numeric"
            aria-label={`Umbral de alerta de ${sendero.nombre}`}
            value={fila.umbral}
            onChange={(e) => setFila((f) => ({ ...f, umbral: e.target.value.replace(/\D/g, '') }))}
            className={`h-10 w-14 rounded-xl border bg-superficie text-center font-mono text-sm focus:border-bosque focus:outline-none ${umbralValido ? 'border-bosque/15' : 'border-error'}`}
          />
          <span className="text-sm text-tinta-suave">%</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={repetir}
            disabled={!fila.cupos.some((c) => c !== '')}
            className="rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap text-pino hover:bg-arena disabled:opacity-40"
            title="Copia el primer cupo escrito en los siete días"
          >
            Toda la semana
          </button>
          <Boton className="h-10 px-4 text-sm" disabled={!cambiada || !valida} cargando={guardando} onClick={guardar}>
            Guardar
          </Boton>
        </div>
      </td>
    </tr>
  );
}

/** Capacidad de carga por sendero y día (RF-23 a RF-26), con la ocupación y las alertas de la semana. */
export function CapacidadPage() {
  const { catalogo, operacion } = useServicios();
  const hoy = useMemo(() => hoyIso(), []);
  const semanas = useMemo(() => Array.from({ length: SEMANAS }, (_, i) => sumarDias(lunesDe(hoy), i * 7)), [hoy]);
  const [lunes, setLunes] = useState(semanas[1]);
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)), [lunes]);

  const consulta = useConsulta(
    () => Promise.all([catalogo.listar(), operacion.capacidad(dias[0], dias[6])]),
    [catalogo, operacion, dias],
  );
  const { recargar, setEstado } = consulta;
  const senderosCargados = consulta.estado.tipo === 'listo' ? consulta.estado.datos[0] : null;

  // Refresca la ocupación sin vaciar la tabla, para no perder lo que se está escribiendo en otras filas.
  const refrescar = useCallback(() => {
    if (!senderosCargados) return;
    operacion.capacidad(dias[0], dias[6]).then(
      (capacidad) => setEstado({ tipo: 'listo', datos: [senderosCargados, capacidad] }),
      () => undefined,
    );
  }, [operacion, dias, senderosCargados, setEstado]);

  // RF-08 y RF-26: cada reserva nueva o alerta de aforo de la semana llega en vivo y actualiza la ocupación.
  useEffect(
    () =>
      operacion.escucharEventos((e) => {
        if (dias.includes(e.fecha)) refrescar();
      }),
    [operacion, dias, refrescar],
  );

  const publicados = useMemo(
    () => new Map((consulta.estado.tipo === 'listo' ? consulta.estado.datos[1] : []).map((d) => [`${d.senderoId}|${d.fecha}`, d])),
    [consulta.estado],
  );
  const senderos = consulta.estado.tipo === 'listo' ? consulta.estado.datos[0].filter((s) => s.activo) : [];
  const nombres = new Map(senderos.map((s) => [s.id, s.nombre]));
  const alertas = [...publicados.values()].filter((d) => d.cupoMaximo > 0 && porcentaje(d) >= d.umbralPct).sort((a, b) => porcentaje(b) - porcentaje(a));
  const sinPublicar = senderos.filter((s) => dias.some((d) => !publicados.has(`${s.id}|${d}`))).length;

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Autoridad ambiental · capacidad de carga" titulo="Capacidad" fotoId="espeletias-laguna">
        <dl className="m-0 flex gap-8">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">días en alerta</dt>
            <dd className={`m-0 font-cifras text-[28px] font-black ${alertas.length > 0 ? 'text-lima' : ''}`}>{alertas.length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">senderos por completar</dt>
            <dd className="m-0 font-cifras text-[28px] font-black">{sinPublicar}</dd>
          </div>
        </dl>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <Pestanas
          etiqueta="Semana"
          valor={lunes}
          onCambio={setLunes}
          opciones={semanas.map((l, i) => ({ valor: l, texto: i === 0 ? 'Esta semana' : `Semana del ${formatoFecha(l)}` }))}
        />
        <p className="m-0 max-w-3xl text-sm text-tinta-suave">
          Escribe el cupo de cada día que vas a abrir. Un día sin cupo no se ofrece en el sitio. Se reserva con pago solo la semana en curso y la siguiente;
          la capacidad se carga a más tardar una semana antes. El sistema no deja vender por encima del cupo y avisa al equipo al cruzar el umbral.
        </p>
      </div>

      {consulta.estado.tipo === 'cargando' && <Cargando texto="Cargando la capacidad de la semana…" />}
      {consulta.estado.tipo === 'error' && <ErrorCarga mensaje={consulta.estado.mensaje} reintentar={recargar} />}

      {consulta.estado.tipo === 'listo' && (
        <>
          {alertas.length > 0 && (
            <section aria-labelledby="cap-alertas" className="flex flex-col">
              <TituloSeccion id="cap-alertas" nota="Días de la semana con la ocupación sobre su umbral">
                Alertas activas
              </TituloSeccion>
              <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
                {alertas.map((a) => (
                  <motion.li
                    key={`${a.senderoId}|${a.fecha}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 rounded-3xl border border-advertencia/25 bg-advertencia/5 p-4"
                  >
                    <svg width="22" height="22" viewBox="0 0 20 20" role="img" aria-label="Alerta" fill="none" stroke="var(--color-advertencia)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                      <path d="M10 2.5 18 17H2Z" />
                      <path d="M10 8v4M10 14.5v.1" />
                    </svg>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{nombres.get(a.senderoId) ?? 'Sendero'}</span>
                      <span className="text-sm text-tinta-suave">
                        {formatoFecha(a.fecha)} · {porcentaje(a)} % del cupo ({a.ocupacion} de {a.cupoMaximo})
                      </span>
                    </span>
                    {porcentaje(a) >= 100 && <Insignia tono="peligro">Lleno</Insignia>}
                  </motion.li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="cap-limites" className="flex flex-col gap-4">
            <TituloSeccion id="cap-limites" nota="Cupo por día · reservados/cupo debajo de cada día">
              Cupos de la semana
            </TituloSeccion>
            {senderos.length === 0 ? (
              <p className="m-0 text-tinta-suave">No hay senderos activos. Créalos en Recorridos.</p>
            ) : (
              <div className="tarjeta relative overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-[15px]">
                  <thead>
                    <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
                      <th scope="col" className="px-5 py-3 font-medium">Sendero</th>
                      {dias.map((d, i) => (
                        <th key={d} scope="col" className="px-1.5 py-3 text-center font-medium">
                          {DIAS_SEMANA[i]} {Number(d.slice(8))}
                        </th>
                      ))}
                      <th scope="col" className="px-1.5 py-3 font-medium">Umbral</th>
                      <th scope="col" className="px-5 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {senderos.map((s) => (
                      <FilaSendero key={s.id} sendero={s} dias={dias} publicados={publicados} onGuardado={refrescar} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
