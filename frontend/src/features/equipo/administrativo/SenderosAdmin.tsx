import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { fotoDeSendero } from '@/contenido/fotos';
import type { Dificultad, Sendero } from '@/domain/sendero';
import { DIFICULTADES } from '@/domain/sendero';
import { SENDEROS } from '@/services/memoria/datos';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { Busqueda, CabeceraPanel, Cajon, Insignia, formatoPesos, useAviso } from '../ui';

type SenderoAdmin = Sendero & { activo: boolean };

const NUEVO: SenderoAdmin = {
  id: '', nombre: '', dificultad: 'Fácil', duracionHoras: 2, distanciaKm: null, horaSalida: '08:00', sector: '', desnivelM: null,
  altitudMaxM: null, precioPorPersona: null, descripcion: '', destacados: [], puntoEncuentro: '', activo: true,
};

const numero = (v: string) => (v === '' ? null : Number(v));

function Formulario({ sendero, onCerrar, onGuardar }: { sendero: SenderoAdmin | null; onCerrar: () => void; onGuardar: (s: SenderoAdmin) => void }) {
  const [b, setB] = useState<SenderoAdmin | null>(null);
  const actual = b && sendero && b.id === sendero.id ? b : sendero;
  const cambiar = <K extends keyof SenderoAdmin>(campo: K, valor: SenderoAdmin[K]) => actual && setB({ ...actual, [campo]: valor });
  const nuevo = sendero?.id === '';
  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (!actual || actual.nombre.trim().length < 3) return;
    onGuardar({ ...actual, id: actual.id || actual.nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-') });
    setB(null);
  };
  return (
    <Cajon
      abierto={sendero !== null}
      onCerrar={() => {
        setB(null);
        onCerrar();
      }}
      titulo={nuevo ? 'Nuevo sendero' : (sendero?.nombre ?? '')}
      subtitulo="Los cambios se publican en el catálogo del sitio"
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-sendero" className="h-11 px-5 text-sm">
            {nuevo ? 'Crear sendero' : 'Guardar cambios'}
          </Boton>
        </>
      }
    >
      {actual && (
        <form id="form-sendero" onSubmit={guardar} className="flex flex-col gap-6">
          <Campo etiqueta="Nombre" value={actual.nombre} onChange={(e) => cambiar('nombre', e.target.value)} required minLength={3} />
          <div className="grid grid-cols-2 gap-5">
            <Selector etiqueta="Dificultad" value={actual.dificultad} onChange={(e) => cambiar('dificultad', e.target.value as Dificultad)} opciones={DIFICULTADES.map((d) => ({ valor: d, texto: d }))} />
            <Campo etiqueta="Sector" value={actual.sector ?? ''} onChange={(e) => cambiar('sector', e.target.value)} />
            <Campo etiqueta="Duración (h)" type="number" step="0.5" min={0.5} value={actual.duracionHoras} onChange={(e) => cambiar('duracionHoras', Number(e.target.value))} />
            <Campo etiqueta="Distancia (km)" type="number" step="0.1" value={actual.distanciaKm ?? ''} onChange={(e) => cambiar('distanciaKm', numero(e.target.value))} />
            <Campo etiqueta="Desnivel (m)" type="number" value={actual.desnivelM ?? ''} onChange={(e) => cambiar('desnivelM', numero(e.target.value))} />
            <Campo etiqueta="Altitud máxima (m)" type="number" value={actual.altitudMaxM ?? ''} onChange={(e) => cambiar('altitudMaxM', numero(e.target.value))} />
            <Campo etiqueta="Tarifa por persona" type="number" step="1000" value={actual.precioPorPersona ?? ''} onChange={(e) => cambiar('precioPorPersona', numero(e.target.value))} ayuda="Pesos colombianos" />
            <Campo etiqueta="Hora de salida" type="time" value={actual.horaSalida} onChange={(e) => cambiar('horaSalida', e.target.value)} />
          </div>
          <Campo etiqueta="Punto de encuentro" value={actual.puntoEncuentro ?? ''} onChange={(e) => cambiar('puntoEncuentro', e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="etiqueta text-tinta-suave">Descripción</span>
            <textarea value={actual.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} rows={4} className="rounded-2xl border border-bosque/15 bg-superficie p-4 text-[15px] leading-relaxed focus:border-bosque focus:outline-none" />
          </label>
          <Campo
            etiqueta="Puntos destacados"
            value={actual.destacados.join(', ')}
            onChange={(e) => cambiar('destacados', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))}
            ayuda="Separados por comas"
          />
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-superficie p-4">
            <span className="flex flex-col">
              <span className="font-semibold">Publicado en el sitio</span>
              <span className="text-sm text-tinta-suave">Si lo das de baja, deja de aparecer y no recibe reservas nuevas.</span>
            </span>
            <input type="checkbox" checked={actual.activo} onChange={(e) => cambiar('activo', e.target.checked)} className="size-6 accent-[var(--color-bosque)]" />
          </label>
        </form>
      )}
    </Cajon>
  );
}

/** Catálogo de senderos y experiencias (RF-35). */
export function SenderosAdmin() {
  const { avisar } = useAviso();
  const [senderos, setSenderos] = useState<SenderoAdmin[]>(SENDEROS.map((s) => ({ ...s, activo: true })));
  const [editando, setEditando] = useState<SenderoAdmin | null>(null);
  const [texto, setTexto] = useState('');
  const visibles = senderos.filter((s) => s.nombre.toLowerCase().includes(texto.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Catálogo del sitio" titulo="Senderos" fotoId="paramo-panorama">
        <Boton onClick={() => setEditando({ ...NUEVO })} conFlecha>
          Nuevo sendero
        </Boton>
      </CabeceraPanel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar sendero" placeholder="Buscar por nombre" />
        <span className="text-sm text-tinta-suave">
          {senderos.filter((s) => s.activo).length} publicados · {senderos.filter((s) => !s.activo).length} dados de baja
        </span>
      </div>

      <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((s, i) => {
          const f = fotoDeSendero(s.id);
          return (
            <motion.li key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }} className={`tarjeta flex flex-col overflow-hidden ${s.activo ? '' : 'opacity-60'}`}>
              <div className="relative h-36">
                <img src={f.srcPequena} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-3 left-3">
                  <Insignia tono={s.activo ? 'lima' : 'neutro'}>{s.activo ? 'Publicado' : 'Dado de baja'}</Insignia>
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="font-display text-lg font-bold">{s.nombre}</span>
                <span className="text-sm text-tinta-suave">
                  {s.dificultad} · {s.duracionHoras} h · {s.distanciaKm ?? '—'} km · {s.precioPorPersona ? formatoPesos(s.precioPorPersona) : 'Sin tarifa'}
                </span>
                <div className="mt-auto flex gap-2 pt-3">
                  <Boton variante="oscuro" className="h-10 flex-1 px-4 text-sm" onClick={() => setEditando(s)}>
                    Editar
                  </Boton>
                  <Boton
                    variante="secundario"
                    className="h-10 px-4 text-sm"
                    onClick={() => {
                      setSenderos((ss) => ss.map((x) => (x.id === s.id ? { ...x, activo: !x.activo } : x)));
                      avisar(s.activo ? `${s.nombre} dado de baja del catálogo` : `${s.nombre} publicado de nuevo`);
                    }}
                  >
                    {s.activo ? 'Dar de baja' : 'Publicar'}
                  </Boton>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <Formulario
        sendero={editando}
        onCerrar={() => setEditando(null)}
        onGuardar={(s) => {
          setSenderos((ss) => (ss.some((x) => x.id === s.id) ? ss.map((x) => (x.id === s.id ? s : x)) : [s, ...ss]));
          avisar(editando?.id ? `${s.nombre} actualizado` : `${s.nombre} creado`);
          setEditando(null);
        }}
      />
    </div>
  );
}
