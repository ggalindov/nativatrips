import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import type { Dificultad } from '@/domain/sendero';
import { DIFICULTADES } from '@/domain/sendero';
import type { DatosSendero, SenderoAdmin } from '@/services/puertos';
import { ErrorServicio } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Selector } from '@/ui/Selector';
import { AreaTexto, Busqueda, CabeceraPanel, Cajon, Insignia, Pestanas, ZonaArchivos, formatoPesos, useAviso } from '../ui';

const MAXIMO_FOTOS = 8;

const VACIO: DatosSendero = {
  nombre: '', descripcion: '', dificultad: 'Fácil', duracionHoras: 2, precioPorPersona: null, requisitosIngreso: '',
  distanciaKm: null, desnivelM: null, altitudMaxM: null, sector: '', horaSalida: '07:00', puntoEncuentro: '', destacados: [],
};

const datosDe = (s: SenderoAdmin): DatosSendero => ({
  nombre: s.nombre, descripcion: s.descripcion, dificultad: s.dificultad, duracionHoras: s.duracionHoras, precioPorPersona: s.precioPorPersona,
  requisitosIngreso: s.requisitosIngreso ?? '', distanciaKm: s.distanciaKm, desnivelM: s.desnivelM, altitudMaxM: s.altitudMaxM,
  sector: s.sector ?? '', horaSalida: s.horaSalida, puntoEncuentro: s.puntoEncuentro ?? '', destacados: s.destacados,
});

const numero = (v: string) => (v === '' ? null : Number(v));
const lista = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

type Estado = 'publicado' | 'borrador' | 'baja';
const estadoDe = (s: SenderoAdmin): Estado => (!s.activo ? 'baja' : s.publicado ? 'publicado' : 'borrador');
const ETIQUETA_ESTADO: Record<Estado, string> = { publicado: 'Publicado', borrador: 'Borrador', baja: 'Dado de baja' };

type Pestana = 'general' | 'ficha' | 'fotos';
const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: 'general', texto: 'General' },
  { valor: 'ficha', texto: 'Ficha técnica y tarifa' },
  { valor: 'fotos', texto: 'Fotos' },
];

/** Formulario del sendero: lo que se guarda es exactamente lo que guarda la API (RF-35). */
function Formulario({
  sendero,
  abierto,
  onCerrar,
  onGuardado,
}: {
  sendero: SenderoAdmin | null;
  abierto: boolean;
  onCerrar: () => void;
  onGuardado: (s: SenderoAdmin, nuevo: boolean) => void;
}) {
  const { catalogo } = useServicios();
  const mensajeDeError = useMensajeError();
  const [datos, setDatos] = useState<DatosSendero>(sendero ? datosDe(sendero) : VACIO);
  const [fotos, setFotos] = useState<string[]>(sendero?.fotos ?? []);
  const [pestana, setPestana] = useState<Pestana>('general');
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nuevo = sendero === null;
  const cambiar = <K extends keyof DatosSendero>(campo: K, valor: DatosSendero[K]) => setDatos((d) => ({ ...d, [campo]: valor }));

  const errorNombre = intentado && datos.nombre.trim().length < 3 ? 'Escribe el nombre del sendero.' : undefined;
  const errorPrecio = intentado && datos.precioPorPersona === null ? 'Escribe la tarifa por persona.' : undefined;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setError(null);
    if (datos.nombre.trim().length < 3 || datos.precioPorPersona === null) {
      setPestana(datos.nombre.trim().length < 3 ? 'general' : 'ficha');
      return;
    }
    setGuardando(true);
    try {
      onGuardado(await catalogo.guardar(datos, sendero?.id), nuevo);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const subir = async (archivos: File[]) => {
    if (!sendero) return;
    setError(null);
    setSubiendo(true);
    try {
      let actualizado = sendero;
      for (const archivo of archivos.slice(0, MAXIMO_FOTOS - fotos.length)) actualizado = await catalogo.subirFoto(sendero.id, archivo);
      setFotos(actualizado.fotos);
      onGuardado(actualizado, false);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setSubiendo(false);
    }
  };

  const quitar = async (url: string) => {
    if (!sendero) return;
    setError(null);
    try {
      const actualizado = await catalogo.borrarFoto(sendero.id, url);
      setFotos(actualizado.fotos);
      onGuardado(actualizado, false);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <Cajon
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={nuevo ? 'Nuevo sendero' : sendero.nombre}
      subtitulo={nuevo ? 'Se crea como borrador: el sitio no lo muestra hasta que lo publiques' : `Estado: ${ETIQUETA_ESTADO[estadoDe(sendero)]}`}
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton type="submit" form="form-sendero" cargando={guardando} className="h-11 px-5 text-sm">
            {nuevo ? 'Crear borrador' : 'Guardar cambios'}
          </Boton>
        </>
      }
    >
      <form id="form-sendero" onSubmit={guardar} noValidate className="flex flex-col gap-6">
        <Pestanas etiqueta="Sección del sendero" valor={pestana} onCambio={setPestana} opciones={nuevo ? PESTANAS.filter((p) => p.valor !== 'fotos') : PESTANAS} />

        {pestana === 'general' && (
          <>
            <Campo etiqueta="Nombre" value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} error={errorNombre} />
            <div className="grid grid-cols-2 gap-5">
              <Selector etiqueta="Dificultad" value={datos.dificultad} onChange={(e) => cambiar('dificultad', e.target.value as Dificultad)} opciones={DIFICULTADES.map((d) => ({ valor: d, texto: d }))} />
              <Campo etiqueta="Sector" value={datos.sector} onChange={(e) => cambiar('sector', e.target.value)} />
            </div>
            <AreaTexto etiqueta="Descripción" valor={datos.descripcion} onCambio={(v) => cambiar('descripcion', v)} ayuda="Obligatoria para publicar" />
            <AreaTexto
              etiqueta="Requisitos de ingreso"
              valor={datos.requisitosIngreso}
              onCambio={(v) => cambiar('requisitosIngreso', v)}
              filas={3}
              ayuda="Documentos, equipo y condición física. Obligatorios para publicar; el turista los ve en la ficha y en el aviso previo."
            />
            <AreaTexto etiqueta="Puntos destacados" valor={datos.destacados.join('\n')} onCambio={(v) => cambiar('destacados', lista(v))} filas={3} ayuda="Uno por línea, máximo 8" />
          </>
        )}

        {pestana === 'ficha' && (
          <div className="grid grid-cols-2 gap-5">
            <Campo etiqueta="Tarifa por persona" type="number" step="1000" min={0} value={datos.precioPorPersona ?? ''} onChange={(e) => cambiar('precioPorPersona', numero(e.target.value))} error={errorPrecio} ayuda="Pesos colombianos" />
            <Campo etiqueta="Hora de salida" type="time" value={datos.horaSalida} onChange={(e) => cambiar('horaSalida', e.target.value)} />
            <Campo etiqueta="Duración (h)" type="number" step="0.5" min={0.5} value={datos.duracionHoras} onChange={(e) => cambiar('duracionHoras', Number(e.target.value))} />
            <Campo etiqueta="Distancia (km)" type="number" step="0.1" value={datos.distanciaKm ?? ''} onChange={(e) => cambiar('distanciaKm', numero(e.target.value))} />
            <Campo etiqueta="Desnivel (m)" type="number" value={datos.desnivelM ?? ''} onChange={(e) => cambiar('desnivelM', numero(e.target.value))} />
            <Campo etiqueta="Altitud máxima (m)" type="number" value={datos.altitudMaxM ?? ''} onChange={(e) => cambiar('altitudMaxM', numero(e.target.value))} />
            <div className="col-span-2">
              <Campo etiqueta="Punto de encuentro" value={datos.puntoEncuentro} onChange={(e) => cambiar('puntoEncuentro', e.target.value)} />
            </div>
            <p className="col-span-2 m-0 rounded-2xl bg-superficie p-4 text-sm text-tinta">El cupo de cada día se carga en Capacidad.</p>
          </div>
        )}

        {pestana === 'fotos' && !nuevo && (
          <div className="flex flex-col gap-3">
            <span className="etiqueta text-tinta-suave">
              {fotos.length} de {MAXIMO_FOTOS} fotos · JPG, PNG o WebP de hasta 5 MB
            </span>
            {fotos.length > 0 && (
              <ul aria-label="Fotos del sendero" className="m-0 grid list-none grid-cols-3 gap-2 p-0">
                {fotos.map((url, i) => (
                  <li key={url} className="relative aspect-square overflow-hidden rounded-2xl">
                    <img src={url} alt={`Foto ${i + 1} de ${sendero.nombre}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Quitar foto ${i + 1}`}
                      onClick={() => quitar(url)}
                      className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-bosque/80 text-white"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fotos.length < MAXIMO_FOTOS && (
              <ZonaArchivos etiqueta={subiendo ? 'Subiendo…' : 'Agregar fotos'} acepta="image/jpeg,image/png,image/webp" compacta onArchivos={subir} />
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="m-0 text-sm text-error">
            {error}
          </p>
        )}
      </form>
    </Cajon>
  );
}

type Filtro = 'todos' | Estado;

/** Catálogo de senderos contra la API: borrador, publicación, baja con aviso y fotos (RF-35). */
export function SenderosAdmin() {
  const { catalogo } = useServicios();
  const { avisar } = useAviso();
  const mensajeDeError = useMensajeError();
  const consulta = useConsulta(() => catalogo.listar(), [catalogo]);
  const [editando, setEditando] = useState<SenderoAdmin | 'nuevo' | null>(null);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [confirmarBaja, setConfirmarBaja] = useState<{ sendero: SenderoAdmin; reservas: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (consulta.estado.tipo === 'cargando') return <Cargando />;
  if (consulta.estado.tipo === 'error') return <ErrorCarga mensaje={consulta.estado.mensaje} reintentar={consulta.recargar} />;
  const senderos = consulta.estado.datos;
  const reemplazar = (s: SenderoAdmin, nuevo: boolean) =>
    consulta.setEstado({ tipo: 'listo', datos: nuevo ? [s, ...senderos] : senderos.map((x) => (x.id === s.id ? s : x)) });

  const visibles = senderos.filter(
    (s) => (filtro === 'todos' || estadoDe(s) === filtro) && s.nombre.toLowerCase().includes(texto.trim().toLowerCase()),
  );
  const cuenta = (e: Estado) => senderos.filter((s) => estadoDe(s) === e).length;

  const publicar = async (s: SenderoAdmin, publicado: boolean) => {
    setError(null);
    try {
      reemplazar(await catalogo.publicar(s.id, publicado), false);
      avisar(publicado ? `${s.nombre} publicado en el sitio` : `${s.nombre} vuelve a borrador`);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const darDeBaja = async (s: SenderoAdmin, confirmar: boolean) => {
    setError(null);
    try {
      await catalogo.darDeBaja(s.id, confirmar);
      reemplazar({ ...s, activo: false }, false);
      setConfirmarBaja(null);
      avisar(`${s.nombre} dado de baja: deja de recibir reservas nuevas`);
    } catch (err) {
      if (err instanceof ErrorServicio && err.codigo === 'reservasFuturas') {
        setConfirmarBaja({ sendero: s, reservas: Number(err.detalles.reservasFuturas ?? 0) });
      } else {
        setError(mensajeDeError(err));
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Catálogo del sitio" titulo="Senderos" fotoId="paramo-panorama">
        <Boton onClick={() => setEditando('nuevo')} conFlecha>
          Nuevo sendero
        </Boton>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <Pestanas
          etiqueta="Estado"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[
            { valor: 'todos' as Filtro, texto: 'Todos', cuenta: senderos.length },
            { valor: 'publicado' as Filtro, texto: 'Publicados', cuenta: cuenta('publicado') },
            { valor: 'borrador' as Filtro, texto: 'Borradores', cuenta: cuenta('borrador') },
            { valor: 'baja' as Filtro, texto: 'Dados de baja', cuenta: cuenta('baja') },
          ]}
        />
        <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar sendero" placeholder="Buscar por nombre" />
      </div>

      {error && (
        <p role="alert" className="m-0 text-sm text-error">
          {error}
        </p>
      )}

      {confirmarBaja && (
        <div role="alertdialog" aria-labelledby="baja-titulo" className="flex flex-col gap-3 rounded-3xl border border-error/30 bg-error/5 p-5">
          <span id="baja-titulo" className="font-bold text-error">
            {confirmarBaja.sendero.nombre} tiene {confirmarBaja.reservas} {confirmarBaja.reservas === 1 ? 'reserva' : 'reservas'} desde hoy
          </span>
          <span className="text-[15px] text-tinta">
            Si lo das de baja deja de recibir reservas nuevas, pero esas reservas siguen en pie: hay que atenderlas o acordar otra fecha con cada titular.
          </span>
          <span className="flex flex-wrap gap-2">
            <Boton variante="peligro" className="h-11 px-4 text-sm" onClick={() => darDeBaja(confirmarBaja.sendero, true)}>
              Dar de baja de todas formas
            </Boton>
            <Boton variante="secundario" className="h-11 px-4 text-sm" onClick={() => setConfirmarBaja(null)}>
              Mantenerlo
            </Boton>
          </span>
        </div>
      )}

      <ul aria-label="Senderos" className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((s, i) => {
          const estado = estadoDe(s);
          const portada = s.fotos[0] ?? fotoDeSendero(s.clave).srcPequena;
          return (
            <motion.li
              key={s.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.04 }}
              className={`tarjeta flex flex-col overflow-hidden ${estado === 'publicado' ? '' : 'opacity-80'}`}
            >
              <div className="relative h-36 bg-bosque/10">
                <img src={portada} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3 flex gap-1.5">
                  <Insignia tono={estado === 'publicado' ? 'lima' : estado === 'borrador' ? 'info' : 'neutro'}>{ETIQUETA_ESTADO[estado]}</Insignia>
                  {s.fotos.length > 0 && <Insignia tono="neutro">{`${s.fotos.length} fotos`}</Insignia>}
                  {!s.requisitosIngreso && <Insignia tono="alerta">Sin requisitos</Insignia>}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="font-display text-lg font-bold">{s.nombre}</span>
                <span className="text-sm text-tinta-suave">
                  {s.dificultad} · {s.duracionHoras} h · {s.distanciaKm ?? '—'} km · {s.precioPorPersona ? formatoPesos(s.precioPorPersona) : 'Sin tarifa'}
                </span>
                <span className="text-xs text-tinta-suave">
                  Salida {s.horaSalida}
                  {s.puntoEncuentro ? ` · ${s.puntoEncuentro}` : ''}
                </span>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Boton variante="oscuro" className="h-10 flex-1 px-4 text-sm" onClick={() => setEditando(s)} aria-label={`Editar ${s.nombre}`}>
                    Editar
                  </Boton>
                  {estado === 'publicado' ? (
                    <Boton variante="secundario" className="h-10 px-4 text-sm" onClick={() => darDeBaja(s, false)} aria-label={`Dar de baja ${s.nombre}`}>
                      Dar de baja
                    </Boton>
                  ) : (
                    <Boton variante="secundario" className="h-10 px-4 text-sm" onClick={() => publicar(s, true)} aria-label={`Publicar ${s.nombre}`}>
                      Publicar
                    </Boton>
                  )}
                </div>
                <div className="flex gap-4 pt-1 text-sm">
                  {estado === 'publicado' && (
                    <>
                      <button type="button" onClick={() => publicar(s, false)} className="min-h-9 bg-transparent p-0 font-semibold text-pino underline">
                        Pasar a borrador
                      </button>
                      <Link to={`/senderos/${s.id}`} target="_blank" className="min-h-9 font-semibold text-pino">
                        Ver en el sitio ↗
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
        {visibles.length === 0 && <li className="tarjeta p-8 text-center text-tinta-suave sm:col-span-2 xl:col-span-3">No hay senderos con ese filtro.</li>}
      </ul>

      <Formulario
        key={editando === null ? 'cerrado' : editando === 'nuevo' ? 'nuevo' : editando.id}
        sendero={editando === 'nuevo' || editando === null ? null : editando}
        abierto={editando !== null}
        onCerrar={() => setEditando(null)}
        onGuardado={(s, nuevo) => {
          reemplazar(s, nuevo);
          if (nuevo) {
            avisar(`${s.nombre} creado como borrador · agrega fotos y publícalo`);
            setEditando(s);
          } else if (editando !== null) {
            avisar(`${s.nombre} guardado`);
          }
        }}
      />
    </div>
  );
}
