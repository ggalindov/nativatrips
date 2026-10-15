import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { CategoriaMedio, ElementoBiblioteca } from '@/domain/biblioteca';
import { CATEGORIAS_MEDIO } from '@/domain/biblioteca';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { BorrarConConfirmacion, CabeceraPanel, Cajon, Insignia, Interruptor, Pestanas, TituloSeccion, ZonaArchivos, useAviso } from '../ui';

/** Elemento de la biblioteca con lo que solo ve el administrador. */
type Medio = ElementoBiblioteca & { publicado: boolean; enPortada: boolean };

/** Archivo elegido en el equipo que aún no se ha publicado. */
interface Pendiente {
  id: string;
  archivo: File;
  vista: string;
  tipo: 'foto' | 'video';
  alt: string;
  categoria: CategoriaMedio;
  credito: string;
  progreso: number;
}

type Filtro = 'todas' | CategoriaMedio;
const MB = 1024 * 1024;
const LIMITE_MB = 25;

const peso = (bytes: number) =>
  bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`;
const sinExtension = (nombre: string) => nombre.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();

/** Marca sobre la miniatura, opaca para que se lea encima de cualquier foto. */
function Etiqueta({ children }: { children: string }) {
  return <span className="rounded-full bg-bosque/85 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{children}</span>;
}

/** Ficha para corregir la descripción, la categoría o los créditos de un medio. */
function FichaMedio({ medio, onCerrar, onGuardar, onEliminar }: { medio: Medio | null; onCerrar: () => void; onGuardar: (m: Medio) => void; onEliminar: (m: Medio) => void }) {
  const [b, setB] = useState<Medio | null>(null);
  const actual = b && medio && b.id === medio.id ? b : medio;
  const cambiar = <K extends keyof Medio>(campo: K, valor: Medio[K]) => actual && setB({ ...actual, [campo]: valor });
  const cerrar = () => {
    setB(null);
    onCerrar();
  };
  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (!actual) return;
    onGuardar(actual);
    setB(null);
  };
  return (
    <Cajon
      abierto={medio !== null}
      onCerrar={cerrar}
      titulo={medio?.tipo === 'video' ? 'Editar video' : 'Editar foto'}
      subtitulo={medio?.propio ? 'Contenido propio' : 'Foto con licencia libre'}
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-medio" className="h-11 px-5 text-sm">
            Guardar cambios
          </Boton>
        </>
      }
    >
      {actual && (
        <form id="form-medio" onSubmit={guardar} className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-3xl bg-bosque">
            {actual.tipo === 'video' ? (
              <video src={actual.src} poster={actual.miniatura} controls muted className="max-h-72 w-full object-contain" />
            ) : (
              <img src={actual.src} alt={actual.alt} className="max-h-72 w-full object-contain" />
            )}
          </div>
          <Campo etiqueta="Descripción" value={actual.alt} onChange={(e) => cambiar('alt', e.target.value)} ayuda="Se lee en voz alta para personas ciegas y aparece en la galería" />
          <div className="grid grid-cols-2 gap-5">
            <Selector etiqueta="Categoría" value={actual.categoria} onChange={(e) => cambiar('categoria', e.target.value as CategoriaMedio)} opciones={CATEGORIAS_MEDIO.map((c) => ({ valor: c, texto: c }))} />
            <Campo etiqueta="Licencia" value={actual.licencia} onChange={(e) => cambiar('licencia', e.target.value)} />
          </div>
          <Campo etiqueta="Autor o créditos" value={actual.credito} onChange={(e) => cambiar('credito', e.target.value)} />
          <Interruptor titulo="Publicada en la biblioteca" nota="Si la ocultas, deja de verse en el sitio pero no se borra." activo={actual.publicado} onCambio={(v) => cambiar('publicado', v)} />
          <Interruptor titulo="Destacada en la portada" nota="Las destacadas salen primero en la galería de la página de inicio." activo={actual.enPortada} onCambio={(v) => cambiar('enPortada', v)} />
          <div className="border-t linea pt-5">
            <BorrarConConfirmacion
              texto={actual.tipo === 'video' ? 'Eliminar video' : 'Eliminar foto'}
              confirmacion="¿Eliminarla de la biblioteca? Desaparece del sitio y de la galería de la portada."
              onBorrar={() => {
                setB(null);
                onEliminar(actual);
              }}
            />
          </div>
        </form>
      )}
    </Cajon>
  );
}

/** Biblioteca de fotos y videos: el administrador sube, edita, oculta y elimina. */
export function BibliotecaAdmin() {
  const { biblioteca } = useServicios();
  const { avisar } = useAviso();
  const { estado } = useConsulta(() => biblioteca.listar(), [biblioteca]);
  const [medios, setMedios] = useState<Medio[] | null>(null);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [editando, setEditando] = useState<Medio | null>(null);
  const [rechazados, setRechazados] = useState<string[]>([]);

  useEffect(() => {
    if (estado.tipo === 'listo' && medios === null) setMedios(estado.datos.map((m, i) => ({ ...m, publicado: true, enPortada: i < 5 })));
  }, [estado, medios]);

  // Simula la barra de carga mientras no exista el servicio de subida.
  const cargando = pendientes.some((p) => p.progreso < 100);
  useEffect(() => {
    if (!cargando) return;
    const t = setInterval(() => setPendientes((ps) => ps.map((p) => (p.progreso < 100 ? { ...p, progreso: Math.min(100, p.progreso + 8 + Math.random() * 14) } : p))), 160);
    return () => clearInterval(t);
  }, [cargando]);

  const recibir = (archivos: File[]) => {
    const grandes = archivos.filter((f) => f.size > LIMITE_MB * MB);
    setRechazados(grandes.map((f) => f.name));
    const nuevos = archivos
      .filter((f) => f.size <= LIMITE_MB * MB)
      .map<Pendiente>((f) => ({
        id: `${f.name}-${f.lastModified}-${Math.random()}`,
        archivo: f,
        vista: URL.createObjectURL(f),
        tipo: f.type.startsWith('video/') ? 'video' : 'foto',
        alt: sinExtension(f.name),
        categoria: 'Paisaje',
        credito: 'Ecopalacio Chingaza',
        progreso: 0,
      }));
    setPendientes((ps) => [...ps, ...nuevos]);
  };
  const cambiarPendiente = (id: string, cambios: Partial<Pendiente>) => setPendientes((ps) => ps.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  const publicar = () => {
    const listos = pendientes.filter((p) => p.progreso >= 100);
    const nuevos = listos.map<Medio>((p) => ({
      id: `propio-${p.id}`,
      tipo: p.tipo,
      src: p.vista,
      miniatura: p.vista,
      ancho: 1600,
      alto: 1067,
      alt: p.alt.trim() || 'Foto del páramo',
      categoria: p.categoria,
      credito: p.credito.trim() || 'Ecopalacio Chingaza',
      licencia: 'Propia',
      propio: true,
      publicado: true,
      enPortada: false,
    }));
    setMedios((ms) => [...nuevos, ...(ms ?? [])]);
    setPendientes((ps) => ps.filter((p) => p.progreso < 100));
    avisar(nuevos.length === 1 ? 'Foto publicada en la biblioteca' : `${nuevos.length} archivos publicados en la biblioteca`);
  };

  const todos = medios ?? [];
  const visibles = todos.filter((m) => filtro === 'todas' || m.categoria === filtro);
  const listosParaPublicar = pendientes.filter((p) => p.progreso >= 100).length;

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Fotos y videos del sitio" titulo="Biblioteca" fotoId="flor-frailejon">
        <dl className="m-0 flex gap-8 text-white">
          {[
            ['propias', todos.filter((m) => m.propio).length],
            ['con licencia', todos.filter((m) => !m.propio).length],
            ['en portada', todos.filter((m) => m.enPortada).length],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dd className="m-0 font-display text-3xl font-extrabold text-lima">{v}</dd>
              <dt className="etiqueta text-[11px] text-white/70">{k}</dt>
            </div>
          ))}
        </dl>
      </CabeceraPanel>

      <section aria-labelledby="bib-subir" className="flex flex-col gap-4">
        <TituloSeccion id="bib-subir" nota={`Fotos JPG, PNG o WebP y videos MP4 · hasta ${LIMITE_MB} MB cada uno`}>
          Subir fotos y videos
        </TituloSeccion>
        <ZonaArchivos etiqueta="Elegir archivos" ayuda="Puedes elegir varios a la vez" onArchivos={recibir} />
        {rechazados.length > 0 && (
          <p role="alert" className="m-0 text-sm text-error">
            {`Superan los ${LIMITE_MB} MB y no se agregaron: ${rechazados.join(', ')}.`}
          </p>
        )}

        {pendientes.length > 0 && (
          <div className="flex flex-col gap-4">
            <ul aria-label="Archivos por publicar" className="m-0 flex list-none flex-col gap-3 p-0">
              <AnimatePresence initial={false}>
                {pendientes.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="tarjeta grid grid-cols-[88px_minmax(0,1fr)] gap-4 p-4 md:grid-cols-[112px_minmax(0,1fr)]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-bosque">
                      {p.tipo === 'video' ? <video src={p.vista} muted className="h-full w-full object-cover" /> : <img src={p.vista} alt="" className="h-full w-full object-cover" />}
                      {p.tipo === 'video' && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-bosque/80 px-2 py-0.5 font-mono text-[10px] text-lima">VIDEO</span>}
                    </div>
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm text-tinta-suave">
                          {p.archivo.name} · {peso(p.archivo.size)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Quitar ${p.archivo.name}`}
                          onClick={() => setPendientes((ps) => ps.filter((x) => x.id !== p.id))}
                          className="flex size-9 flex-none items-center justify-center rounded-full text-tinta-suave hover:bg-bosque/10"
                        >
                          ×
                        </button>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Carga de ${p.archivo.name}`}
                        aria-valuenow={Math.round(p.progreso)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-1.5 overflow-hidden rounded-full bg-bosque/10"
                      >
                        <div className={`h-full rounded-full transition-[width] duration-150 ${p.progreso >= 100 ? 'bg-[#3a8a5c]' : 'bg-bosque'}`} style={{ width: `${p.progreso}%` }} />
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
                        <Campo etiqueta="Descripción" value={p.alt} onChange={(e) => cambiarPendiente(p.id, { alt: e.target.value })} />
                        <Selector
                          etiqueta="Categoría"
                          value={p.categoria}
                          onChange={(e) => cambiarPendiente(p.id, { categoria: e.target.value as CategoriaMedio })}
                          opciones={CATEGORIAS_MEDIO.map((c) => ({ valor: c, texto: c }))}
                        />
                        <Campo etiqueta="Créditos" value={p.credito} onChange={(e) => cambiarPendiente(p.id, { credito: e.target.value })} />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="text-sm text-tinta-suave">{cargando ? 'Cargando archivos…' : 'Revisa las descripciones antes de publicar.'}</span>
              <Boton onClick={publicar} disabled={listosParaPublicar === 0} conFlecha>
                {listosParaPublicar > 1 ? `Publicar ${listosParaPublicar} archivos` : 'Publicar'}
              </Boton>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="bib-contenido" className="flex flex-col gap-4">
        <TituloSeccion
          id="bib-contenido"
          nota="Toca una foto para editarla"
          accion={
            <Pestanas
              etiqueta="Categoría"
              valor={filtro}
              onCambio={setFiltro}
              opciones={[{ valor: 'todas' as Filtro, texto: 'Todas', cuenta: todos.length }, ...CATEGORIAS_MEDIO.map((c) => ({ valor: c as Filtro, texto: c, cuenta: todos.filter((m) => m.categoria === c).length }))]}
            />
          }
        >
          En el sitio
        </TituloSeccion>
        {medios === null ? (
          <p className="m-0 text-tinta-suave">Cargando la biblioteca…</p>
        ) : (
          <ul aria-label="Medios de la biblioteca" className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibles.map((m) => (
              <motion.li key={m.id} layout className={m.publicado ? '' : 'opacity-50'}>
                <button type="button" onClick={() => setEditando(m)} aria-label={`Editar ${m.alt}`} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-bosque text-left">
                  <img src={m.miniatura} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {m.propio && <Insignia tono="lima">Propia</Insignia>}
                    {m.enPortada && <Etiqueta>Portada</Etiqueta>}
                    {!m.publicado && <Etiqueta>Oculta</Etiqueta>}
                    {m.tipo === 'video' && <Etiqueta>Video</Etiqueta>}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bosque/90 to-transparent p-3 pt-8 text-sm font-semibold text-white">
                    <span className="line-clamp-1">{m.alt}</span>
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <FichaMedio
        medio={editando}
        onCerrar={() => setEditando(null)}
        onGuardar={(m) => {
          setMedios((ms) => (ms ?? []).map((x) => (x.id === m.id ? m : x)));
          setEditando(null);
          avisar('Cambios guardados');
        }}
        onEliminar={(m) => {
          setMedios((ms) => (ms ?? []).filter((x) => x.id !== m.id));
          setEditando(null);
          avisar(m.tipo === 'video' ? 'Video eliminado' : 'Foto eliminada');
        }}
      />
    </div>
  );
}
