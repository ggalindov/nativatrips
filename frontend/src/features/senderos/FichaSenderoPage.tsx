import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FOTOS_GALERIA, foto, fotoDeSendero } from '@/contenido/fotos';
import type { FotoConRuta } from '@/contenido/fotos';
import { cuposLibres } from '@/domain/aforo';
import { formatearFecha, hoyIso, sumarDias } from '@/domain/fechas';
import type { Sendero } from '@/domain/sendero';
import { formatearDuracion, formatearMetros, formatearPesos } from '@/domain/sendero';
import { SelectorFecha } from '@/features/reservas/SelectorFecha';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { Boton, EnlaceBoton } from '@/ui/Boton';
import { Dialogo } from '@/ui/Dialogo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, CURVA, Contador, Escalonado, itemEscalonado } from '@/ui/movimiento';
import { PildoraDificultad } from './TarjetaSendero';

const DIAS_VISIBLES = 14;

/** Foto principal del sendero y cuatro de la galería del parque, distintas según el sendero. */
function fotosDe(s: Sendero, indice: number): FotoConRuta[] {
  const extra = Array.from({ length: 4 }, (_, i) => foto(FOTOS_GALERIA[(indice * 3 + i) % FOTOS_GALERIA.length]));
  return [fotoDeSendero(s.id), ...extra];
}

function Galeria({ fotos, nombre }: { fotos: FotoConRuta[]; nombre: string }) {
  const [activa, setActiva] = useState(0);
  const [visor, setVisor] = useState(false);
  const mover = (d: number) => setActiva((a) => (a + d + fotos.length) % fotos.length);
  const f = fotos[activa];

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative h-[340px] overflow-hidden rounded-[32px] md:h-[520px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={f.id}
            src={f.src}
            alt={f.alt}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: CURVA }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bosque/60 to-transparent" />
        <button
          type="button"
          onClick={() => setVisor(true)}
          className="absolute right-5 bottom-5 rounded-full bg-white/90 px-5 py-2.5 text-sm font-bold text-bosque shadow-lg transition-transform hover:scale-105"
        >
          Ver foto completa
        </button>
        <span className="absolute bottom-5 left-5 max-w-[60%] text-xs text-white/80">
          Foto: {f.autor} · {f.licencia}
        </span>
      </div>
      <div role="group" aria-label={`Fotos de ${nombre}`} className="grid grid-cols-5 gap-3">
        {fotos.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={i === activa}
            aria-label={`Ver foto ${i + 1}: ${x.alt}`}
            onClick={() => setActiva(i)}
            className={`relative h-20 overflow-hidden rounded-2xl transition-all md:h-24 ${i === activa ? 'ring-4 ring-lima' : 'opacity-70 hover:opacity-100'}`}
          >
            <img src={x.srcPequena} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialogo abierto={visor} onCerrar={() => setVisor(false)} titulo={f.alt} ancho="max-w-6xl">
        <div className="relative bg-bosque">
          <img src={f.src} alt={f.alt} className="max-h-[80vh] w-full object-contain" />
          <div className="flex items-center justify-between gap-4 p-4 text-white">
            <button type="button" onClick={() => mover(-1)} className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20" aria-label="Foto anterior">
              ←
            </button>
            <span className="text-center text-sm text-white/80">
              {f.alt} · {f.autor} ({f.licencia})
            </span>
            <button type="button" onClick={() => mover(1)} className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20" aria-label="Foto siguiente">
              →
            </button>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}

function Cifra({ titulo, valor, sufijo, texto }: { titulo: string; valor: number | null; sufijo: string; texto?: string }) {
  return (
    <motion.div variants={itemEscalonado} className="tarjeta flex flex-col gap-1 p-6">
      <span className="text-sm text-tinta-suave">{titulo}</span>
      <span className="font-cifras text-3xl font-black">
        {valor === null ? '—' : Number.isInteger(valor) ? <Contador valor={valor} sufijo={sufijo} /> : `${String(valor).replace('.', ',')}${sufijo}`}
      </span>
      {texto && <span className="text-xs text-tinta-suave">{texto}</span>}
    </motion.div>
  );
}

export function FichaSenderoPage() {
  const { senderoId = '' } = useParams();
  const navegar = useNavigate();
  const { senderos } = useServicios();
  const desde = useMemo(() => sumarDias(hoyIso(), 1), []);
  const catalogo = useConsulta(() => senderos.listar(), [senderos]);
  const dias = useConsulta(() => senderos.disponibilidad(senderoId, desde, DIAS_VISIBLES), [senderos, senderoId, desde]);
  const [fecha, setFecha] = useState<string | null>(null);

  if (catalogo.estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-4 py-20"><Cargando /></div>;
  if (catalogo.estado.tipo === 'error') return <div className="mx-auto max-w-7xl px-4 py-20"><ErrorCarga mensaje={catalogo.estado.mensaje} reintentar={catalogo.recargar} /></div>;

  const indice = catalogo.estado.datos.findIndex((s) => s.id === senderoId);
  const s = catalogo.estado.datos[indice];
  if (!s) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-24">
        <h1 className="m-0 font-display text-4xl font-extrabold">No encontramos ese sendero.</h1>
        <EnlaceBoton to="/senderos" conFlecha>Ver los 13 senderos</EnlaceBoton>
      </div>
    );
  }

  const disp = dias.estado.tipo === 'listo' ? dias.estado.datos.find((d) => d.fecha === fecha) : undefined;
  const reservar = () => navegar(`/reservar/${s.id}${fecha ? `?fecha=${fecha}` : ''}`);

  return (
    <div className="pb-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-8 sm:px-8 lg:px-12">
        <nav aria-label="Ruta de navegación" className="text-sm text-tinta-suave">
          <Link to="/">Inicio</Link> <span aria-hidden="true">/</span> <Link to="/senderos">Senderos</Link> <span aria-hidden="true">/</span>{' '}
          <span aria-current="page" className="font-semibold text-bosque">{s.nombre}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <Aparecer>
            <Galeria fotos={fotosDe(s, indice)} nombre={s.nombre} />
          </Aparecer>
          <Aparecer retraso={0.1} className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <PildoraDificultad dificultad={s.dificultad} />
              <span className="etiqueta text-tinta-suave">{s.sector}</span>
            </div>
            <h1 className="m-0 font-display text-5xl leading-[0.95] font-extrabold tracking-tight md:text-6xl">{s.nombre}</h1>
            <p className="m-0 text-[17px] leading-relaxed text-tinta">{s.descripcion}</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {s.destacados.map((d) => (
                <li key={d} className="flex items-center gap-3 text-[15px]">
                  <span aria-hidden="true" className="flex size-6 flex-none items-center justify-center rounded-full bg-lima text-xs font-black">✓</span>
                  {d}
                </li>
              ))}
            </ul>
            <div className="tarjeta mt-auto flex flex-col gap-1 p-5">
              <span className="etiqueta text-tinta-suave">Punto de encuentro · salida {s.horaSalida}</span>
              <span className="font-display text-lg font-bold">{s.puntoEncuentro ?? 'Se confirma con la reserva'}</span>
            </div>
          </Aparecer>
        </div>

        <Escalonado className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Cifra titulo="Duración estimada" valor={s.duracionHoras} sufijo=" h" />
          <Cifra titulo="Longitud del recorrido" valor={s.distanciaKm} sufijo=" km" />
          <Cifra titulo="Desnivel positivo" valor={s.desnivelM} sufijo=" m" />
          <Cifra titulo="Altitud máxima" valor={s.altitudMaxM} sufijo=" m" texto="sobre el nivel del mar" />
        </Escalonado>

        <section aria-labelledby="agenda" className="grid gap-8 rounded-[40px] bg-superficie p-6 shadow-[var(--shadow-tarjeta)] md:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="agenda" className="m-0 font-display text-3xl font-extrabold">Agenda tu visita</h2>
              <span className="flex items-center gap-2 text-sm font-semibold text-tinta">
                <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-ecosistema" /> Cupos regulados en vivo
              </span>
            </div>
            {dias.estado.tipo === 'cargando' && <Cargando texto="Consultando cupos…" />}
            {dias.estado.tipo === 'error' && <ErrorCarga mensaje={dias.estado.mensaje} reintentar={dias.recargar} />}
            {dias.estado.tipo === 'listo' && <SelectorFecha dias={dias.estado.datos} seleccionada={fecha} onElegir={setFecha} />}
          </div>
          <div className="flex flex-col gap-4 rounded-[28px] bg-bosque p-7 text-white">
            <span className="etiqueta text-lima">Tu fecha</span>
            <AnimatePresence mode="wait">
              <motion.span key={fecha ?? 'sin'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-display text-3xl font-extrabold">
                {fecha ? formatearFecha(fecha) : 'Elige un día'}
              </motion.span>
            </AnimatePresence>
            <dl className="m-0 flex flex-col gap-2.5 border-t border-white/15 pt-4 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-white/70">Tarifa por visitante</dt><dd className="m-0 font-bold">{formatearPesos(s.precioPorPersona)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">Guía local</dt><dd className="m-0 font-bold">Incluido</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">Cupos ese día</dt><dd className="m-0 font-bold">{disp ? cuposLibres(disp) : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">Duración · distancia</dt><dd className="m-0 font-bold">{formatearDuracion(s.duracionHoras)} · {formatearMetros(s.desnivelM)} desnivel</dd></div>
            </dl>
            <Boton conFlecha disabled={!fecha} onClick={reservar} className="mt-2">
              Continuar con esta fecha
            </Boton>
          </div>
        </section>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: CURVA, delay: 0.6 }}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-bosque-2 bg-bosque/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-12">
          <div className="flex min-w-0 flex-col text-white">
            <span className="truncate font-display font-bold">{s.nombre}</span>
            <span className="text-sm text-white/70">{formatearPesos(s.precioPorPersona)} por persona</span>
          </div>
          <Boton conFlecha onClick={reservar}>
            Reservar ahora
          </Boton>
        </div>
      </motion.div>
    </div>
  );
}
