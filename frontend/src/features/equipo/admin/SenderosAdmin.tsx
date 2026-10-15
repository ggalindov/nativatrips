import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import type { Dificultad, Sendero } from '@/domain/sendero';
import { DIFICULTADES } from '@/domain/sendero';
import { SENDEROS } from '@/services/memoria/datos';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { AreaTexto, BorrarConConfirmacion, Busqueda, CabeceraPanel, Cajon, Insignia, Interruptor, Pestanas, ZonaArchivos, formatoPesos, useAviso } from '../ui';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const NOMBRE_DIA: Record<(typeof DIAS)[number], string> = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes', S: 'sábado', D: 'domingo' };
const IDIOMAS = ['Español', 'Inglés', 'Francés', 'Portugués'] as const;

interface FotoRecorrido {
  id: string;
  src: string;
}

/** Recorrido tal como lo edita el administrador: el sendero publicado más su operación y sus fotos. */
type Recorrido = Sendero & {
  activo: boolean;
  portada: string;
  galeria: FotoRecorrido[];
  horariosExtra: string[];
  dias: (typeof DIAS)[number][];
  cupoPorSalida: number;
  edadMinima: number | null;
  tarifaExtranjero: number | null;
  tarifaNino: number | null;
  idiomas: (typeof IDIOMAS)[number][];
  incluye: string[];
  recomendaciones: string;
  restricciones: string;
};

const desdeSendero = (s: Sendero): Recorrido => ({
  ...s,
  activo: true,
  portada: fotoDeSendero(s.id).srcPequena,
  galeria: [],
  horariosExtra: [],
  dias: s.dificultad === 'Exigente' ? ['S', 'D'] : ['M', 'X', 'J', 'V', 'S', 'D'],
  cupoPorSalida: s.dificultad === 'Fácil' ? 20 : 12,
  edadMinima: s.dificultad === 'Fácil' ? 6 : 12,
  tarifaExtranjero: s.precioPorPersona ? Math.round((s.precioPorPersona * 1.25) / 1000) * 1000 : null,
  tarifaNino: s.precioPorPersona ? Math.round((s.precioPorPersona * 0.7) / 1000) * 1000 : null,
  idiomas: ['Español', 'Inglés'],
  incluye: ['Guía local certificado', 'Entrada al parque', 'Seguro de asistencia', 'Refrigerio'],
  recomendaciones: 'Ropa impermeable, botas, abrigo por capas, bloqueador y agua.',
  restricciones: '',
});

const NUEVO: Recorrido = {
  ...desdeSendero({
    id: '', nombre: '', dificultad: 'Fácil', duracionHoras: 2, distanciaKm: null, horaSalida: '08:00', sector: '', desnivelM: null,
    altitudMaxM: null, precioPorPersona: null, descripcion: '', destacados: [], puntoEncuentro: '',
  }),
  portada: '',
  activo: false,
};

const numero = (v: string) => (v === '' ? null : Number(v));
const lista = (v: string) => v.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const slug = (v: string) => v.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Pestana = 'general' | 'ficha' | 'operacion' | 'tarifas' | 'fotos';
const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: 'general', texto: 'General' },
  { valor: 'ficha', texto: 'Ficha técnica' },
  { valor: 'operacion', texto: 'Operación' },
  { valor: 'tarifas', texto: 'Tarifas' },
  { valor: 'fotos', texto: 'Fotos' },
];

/** Selección múltiple en forma de fichas (días, idiomas). */
function Fichas<T extends string>({ etiqueta, opciones, valor, onCambio, texto = (v) => v }: { etiqueta: string; opciones: readonly T[]; valor: T[]; onCambio: (v: T[]) => void; texto?: (v: T) => string }) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="etiqueta pb-2 text-tinta-suave">{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const activo = valor.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={activo}
              aria-label={texto(o)}
              onClick={() => onCambio(activo ? valor.filter((v) => v !== o) : opciones.filter((x) => x === o || valor.includes(x)))}
              className={`h-10 min-w-10 rounded-full px-3.5 text-sm font-semibold transition-colors ${activo ? 'bg-bosque text-lima' : 'bg-superficie text-tinta hover:bg-bosque/10'}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Lee una imagen elegida en el equipo como URL local, solo para la vista previa. */
const vistaPrevia = (f: File) => URL.createObjectURL(f);

function Formulario({ recorrido, onCerrar, onGuardar, onEliminar }: { recorrido: Recorrido | null; onCerrar: () => void; onGuardar: (r: Recorrido) => void; onEliminar: (r: Recorrido) => void }) {
  const [b, setB] = useState<Recorrido | null>(null);
  const [pestana, setPestana] = useState<Pestana>('general');
  const [intentado, setIntentado] = useState(false);
  const actual = b && recorrido && b.id === recorrido.id ? b : recorrido;
  const cambiar = <K extends keyof Recorrido>(campo: K, valor: Recorrido[K]) => actual && setB({ ...actual, [campo]: valor });
  const nuevo = recorrido?.id === '';
  const errorNombre = intentado && actual && actual.nombre.trim().length < 3 ? 'Escribe el nombre del recorrido.' : undefined;

  useEffect(() => {
    if (recorrido) setPestana('general');
  }, [recorrido]);

  const cerrar = () => {
    setB(null);
    setIntentado(false);
    onCerrar();
  };
  const guardar = (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (!actual) return;
    if (actual.nombre.trim().length < 3) {
      setPestana('general');
      return;
    }
    onGuardar({ ...actual, nombre: actual.nombre.trim(), id: actual.id || slug(actual.nombre) });
    setB(null);
    setIntentado(false);
  };

  return (
    <Cajon
      abierto={recorrido !== null}
      onCerrar={cerrar}
      titulo={nuevo ? 'Nuevo recorrido' : (recorrido?.nombre ?? '')}
      subtitulo="Los cambios se publican en el catálogo del sitio"
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-recorrido" className="h-11 px-5 text-sm">
            {nuevo ? 'Crear recorrido' : 'Guardar cambios'}
          </Boton>
        </>
      }
    >
      {actual && (
        <form id="form-recorrido" onSubmit={guardar} noValidate className="flex flex-col gap-6">
          <Pestanas etiqueta="Sección del recorrido" valor={pestana} onCambio={setPestana} opciones={PESTANAS} />

          {pestana === 'general' && (
            <>
              <Campo etiqueta="Nombre" value={actual.nombre} onChange={(e) => cambiar('nombre', e.target.value)} error={errorNombre} />
              <div className="grid grid-cols-2 gap-5">
                <Selector etiqueta="Dificultad" value={actual.dificultad} onChange={(e) => cambiar('dificultad', e.target.value as Dificultad)} opciones={DIFICULTADES.map((d) => ({ valor: d, texto: d }))} />
                <Campo etiqueta="Sector" value={actual.sector ?? ''} onChange={(e) => cambiar('sector', e.target.value)} />
              </div>
              <AreaTexto etiqueta="Descripción" valor={actual.descripcion} onCambio={(v) => cambiar('descripcion', v)} />
              <AreaTexto etiqueta="Puntos destacados" valor={actual.destacados.join('\n')} onCambio={(v) => cambiar('destacados', lista(v))} filas={3} ayuda="Uno por línea" />
              <Interruptor
                titulo="Publicado en el sitio"
                nota="Si lo das de baja, deja de aparecer y no recibe reservas nuevas."
                activo={actual.activo}
                onCambio={(v) => cambiar('activo', v)}
              />
            </>
          )}

          {pestana === 'ficha' && (
            <div className="grid grid-cols-2 gap-5">
              <Campo etiqueta="Duración (h)" type="number" step="0.5" min={0.5} value={actual.duracionHoras} onChange={(e) => cambiar('duracionHoras', Number(e.target.value))} />
              <Campo etiqueta="Distancia (km)" type="number" step="0.1" value={actual.distanciaKm ?? ''} onChange={(e) => cambiar('distanciaKm', numero(e.target.value))} />
              <Campo etiqueta="Desnivel (m)" type="number" value={actual.desnivelM ?? ''} onChange={(e) => cambiar('desnivelM', numero(e.target.value))} />
              <Campo etiqueta="Altitud máxima (m)" type="number" value={actual.altitudMaxM ?? ''} onChange={(e) => cambiar('altitudMaxM', numero(e.target.value))} />
              <Campo etiqueta="Edad mínima" type="number" min={0} value={actual.edadMinima ?? ''} onChange={(e) => cambiar('edadMinima', numero(e.target.value))} ayuda="Vacío si no hay límite" />
              <div className="col-span-2">
                <AreaTexto etiqueta="Restricciones" valor={actual.restricciones} onCambio={(v) => cambiar('restricciones', v)} filas={2} ayuda="Ej. no apto para personas con problemas cardíacos" />
              </div>
              <div className="col-span-2">
                <AreaTexto etiqueta="Qué llevar" valor={actual.recomendaciones} onCambio={(v) => cambiar('recomendaciones', v)} filas={3} />
              </div>
            </div>
          )}

          {pestana === 'operacion' && (
            <>
              <Campo etiqueta="Punto de encuentro" value={actual.puntoEncuentro ?? ''} onChange={(e) => cambiar('puntoEncuentro', e.target.value)} />
              <Fichas etiqueta="Días de operación" opciones={DIAS} valor={actual.dias} onCambio={(v) => cambiar('dias', v)} texto={(d) => NOMBRE_DIA[d]} />
              <div className="flex flex-col gap-3">
                <span className="etiqueta text-tinta-suave">Horarios de salida</span>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {[actual.horaSalida, ...actual.horariosExtra].map((h, i) => (
                    <li key={i} className="flex items-center gap-1 rounded-full bg-superficie py-1 pr-1 pl-2">
                      <input
                        type="time"
                        aria-label={`Salida ${i + 1}`}
                        value={h}
                        onChange={(e) =>
                          i === 0 ? cambiar('horaSalida', e.target.value) : cambiar('horariosExtra', actual.horariosExtra.map((x, j) => (j === i - 1 ? e.target.value : x)))
                        }
                        className="h-9 rounded-full bg-transparent px-2 font-mono text-sm focus:outline-none"
                      />
                      {i > 0 && (
                        <button
                          type="button"
                          aria-label={`Quitar salida de las ${h}`}
                          onClick={() => cambiar('horariosExtra', actual.horariosExtra.filter((_, j) => j !== i - 1))}
                          className="flex size-8 items-center justify-center rounded-full text-tinta-suave hover:bg-bosque/10"
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={() => cambiar('horariosExtra', [...actual.horariosExtra, '13:00'])} className="h-11 rounded-full border border-dashed border-bosque/30 px-4 text-sm font-semibold">
                      + Agregar horario
                    </button>
                  </li>
                </ul>
              </div>
              <Campo etiqueta="Cupo por salida" type="number" min={1} value={actual.cupoPorSalida} onChange={(e) => cambiar('cupoPorSalida', Number(e.target.value))} ayuda="El tope diario lo fija Capacidad" />
              <Fichas etiqueta="Idiomas del guía" opciones={IDIOMAS} valor={actual.idiomas} onCambio={(v) => cambiar('idiomas', v)} />
              <AreaTexto etiqueta="Qué incluye" valor={actual.incluye.join('\n')} onCambio={(v) => cambiar('incluye', lista(v))} filas={4} ayuda="Uno por línea" />
            </>
          )}

          {pestana === 'tarifas' && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
              <Campo etiqueta="Tarifa nacional" type="number" step="1000" value={actual.precioPorPersona ?? ''} onChange={(e) => cambiar('precioPorPersona', numero(e.target.value))} ayuda="Pesos por persona" />
              <Campo etiqueta="Tarifa extranjeros" type="number" step="1000" value={actual.tarifaExtranjero ?? ''} onChange={(e) => cambiar('tarifaExtranjero', numero(e.target.value))} ayuda="Incluye la entrada diferenciada del parque" />
              <Campo etiqueta="Tarifa niños" type="number" step="1000" value={actual.tarifaNino ?? ''} onChange={(e) => cambiar('tarifaNino', numero(e.target.value))} ayuda="Menores de 12 años" />
              <p className="m-0 self-end rounded-2xl bg-superficie p-4 text-sm text-tinta">Sin tarifa nacional, el sitio muestra «Por confirmar» y no deja reservar.</p>
            </div>
          )}

          {pestana === 'fotos' && (
            <>
              <div className="flex flex-col gap-3">
                <span className="etiqueta text-tinta-suave">Foto de portada</span>
                {actual.portada ? (
                  <div className="relative overflow-hidden rounded-3xl">
                    <img src={actual.portada} alt={`Portada de ${actual.nombre || 'el recorrido'}`} className="h-48 w-full object-cover" />
                    <button type="button" onClick={() => cambiar('portada', '')} className="absolute top-3 right-3 h-10 rounded-full bg-bosque/80 px-4 text-sm font-semibold text-white backdrop-blur">
                      Cambiar portada
                    </button>
                  </div>
                ) : (
                  <ZonaArchivos etiqueta="Elegir portada" acepta="image/*" multiple={false} compacta ayuda="JPG o WebP horizontal, mínimo 1600 px de ancho" onArchivos={([f]) => cambiar('portada', vistaPrevia(f))} />
                )}
              </div>
              <div className="flex flex-col gap-3">
                <span className="etiqueta text-tinta-suave">Galería de la ficha · {actual.galeria.length} fotos</span>
                {actual.galeria.length > 0 && (
                  <ul aria-label="Galería del recorrido" className="m-0 grid list-none grid-cols-3 gap-2 p-0">
                    {actual.galeria.map((f, i) => (
                      <li key={f.id} className="group relative aspect-square overflow-hidden rounded-2xl">
                        <img src={f.src} alt={`Foto ${i + 1} de la galería`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          aria-label={`Quitar foto ${i + 1}`}
                          onClick={() => cambiar('galeria', actual.galeria.filter((x) => x.id !== f.id))}
                          className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-bosque/80 text-white"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <ZonaArchivos
                  etiqueta="Agregar fotos"
                  acepta="image/*"
                  compacta
                  onArchivos={(fs) => cambiar('galeria', [...actual.galeria, ...fs.map((f) => ({ id: `${f.name}-${f.lastModified}-${Math.random()}`, src: vistaPrevia(f) }))])}
                />
              </div>
            </>
          )}

          {!nuevo && (
            <div className="border-t linea pt-5">
              <BorrarConConfirmacion
                texto="Eliminar recorrido"
                confirmacion={`¿Eliminar ${actual.nombre}? Desaparece del sitio. Las reservas ya hechas se conservan; si solo quieres pausarlo, mejor dalo de baja.`}
                onBorrar={() => {
                  setB(null);
                  onEliminar(actual);
                }}
              />
            </div>
          )}
        </form>
      )}
    </Cajon>
  );
}

type Filtro = 'todos' | 'publicados' | 'baja';

/** Catálogo de recorridos: el administrador crea, edita, duplica, pausa o elimina (RF-35). */
export function SenderosAdmin() {
  const { avisar } = useAviso();
  const [recorridos, setRecorridos] = useState<Recorrido[]>(() => SENDEROS.map(desdeSendero));
  const [editando, setEditando] = useState<Recorrido | null>(null);
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const visibles = recorridos.filter(
    (r) => (filtro === 'todos' || (filtro === 'publicados' ? r.activo : !r.activo)) && r.nombre.toLowerCase().includes(texto.trim().toLowerCase()),
  );
  const duplicar = (r: Recorrido) => {
    let nombre = `${r.nombre} (copia)`;
    for (let n = 2; recorridos.some((x) => x.nombre === nombre); n++) nombre = `${r.nombre} (copia ${n})`;
    const copia = { ...r, id: slug(nombre), nombre, activo: false };
    setRecorridos((rs) => [copia, ...rs]);
    avisar(`${nombre} creado sin publicar`);
  };

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Catálogo del sitio" titulo="Recorridos" fotoId="paramo-panorama">
        <Boton onClick={() => setEditando({ ...NUEVO })} conFlecha>
          Nuevo recorrido
        </Boton>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <Pestanas
          etiqueta="Estado"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[
            { valor: 'todos' as Filtro, texto: 'Todos', cuenta: recorridos.length },
            { valor: 'publicados' as Filtro, texto: 'Publicados', cuenta: recorridos.filter((r) => r.activo).length },
            { valor: 'baja' as Filtro, texto: 'Dados de baja', cuenta: recorridos.filter((r) => !r.activo).length },
          ]}
        />
        <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar recorrido" placeholder="Buscar por nombre" />
      </div>

      <ul aria-label="Recorridos" className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((r, i) => (
          <motion.li
            key={r.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 9) * 0.04 }}
            className={`tarjeta flex flex-col overflow-hidden ${r.activo ? '' : 'opacity-70'}`}
          >
            <div className="relative h-36 bg-bosque/10">
              {r.portada && <img src={r.portada} alt="" className="h-full w-full object-cover" />}
              <span className="absolute top-3 left-3 flex gap-1.5">
                <Insignia tono={r.activo ? 'lima' : 'neutro'}>{r.activo ? 'Publicado' : 'Dado de baja'}</Insignia>
                {r.galeria.length > 0 && <Insignia tono="neutro">{`+${r.galeria.length} fotos`}</Insignia>}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="font-display text-lg font-bold">{r.nombre}</span>
              <span className="text-sm text-tinta-suave">
                {r.dificultad} · {r.duracionHoras} h · {r.distanciaKm ?? '—'} km · {r.precioPorPersona ? formatoPesos(r.precioPorPersona) : 'Sin tarifa'}
              </span>
              <span className="text-xs text-tinta-suave">
                {r.dias.join(' ')} · {[r.horaSalida, ...r.horariosExtra].join(', ')} · cupo {r.cupoPorSalida}
              </span>
              <div className="mt-auto flex flex-wrap gap-2 pt-3">
                <Boton variante="oscuro" className="h-10 flex-1 px-4 text-sm" onClick={() => setEditando(r)} aria-label={`Editar ${r.nombre}`}>
                  Editar
                </Boton>
                <Boton
                  variante="secundario"
                  className="h-10 px-4 text-sm"
                  onClick={() => {
                    setRecorridos((rs) => rs.map((x) => (x.id === r.id ? { ...x, activo: !x.activo } : x)));
                    avisar(r.activo ? `${r.nombre} dado de baja del catálogo` : `${r.nombre} publicado`);
                  }}
                >
                  {r.activo ? 'Dar de baja' : 'Publicar'}
                </Boton>
              </div>
              <div className="flex gap-4 pt-1 text-sm">
                <button type="button" onClick={() => duplicar(r)} className="min-h-9 bg-transparent p-0 font-semibold text-pino underline">
                  Duplicar
                </button>
                {SENDEROS.some((s) => s.id === r.id) && (
                  <Link to={`/senderos/${r.id}`} target="_blank" className="min-h-9 font-semibold text-pino">
                    Ver en el sitio ↗
                  </Link>
                )}
              </div>
            </div>
          </motion.li>
        ))}
        {visibles.length === 0 && <li className="tarjeta p-8 text-center text-tinta-suave sm:col-span-2 xl:col-span-3">No hay recorridos con ese filtro.</li>}
      </ul>

      <Formulario
        recorrido={editando}
        onCerrar={() => setEditando(null)}
        onGuardar={(r) => {
          const existe = !!editando?.id;
          setRecorridos((rs) => (existe ? rs.map((x) => (x.id === editando?.id ? r : x)) : [r, ...rs]));
          avisar(existe ? `${r.nombre} actualizado` : `${r.nombre} creado`);
          setEditando(null);
        }}
        onEliminar={(r) => {
          setRecorridos((rs) => rs.filter((x) => x.id !== r.id));
          avisar(`${r.nombre} eliminado`);
          setEditando(null);
        }}
      />
    </div>
  );
}
