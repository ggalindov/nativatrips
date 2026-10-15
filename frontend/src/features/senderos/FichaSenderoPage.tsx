import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { atributosFoto, foto, fotoDeSendero, FOTOS_GALERIA } from '@/contenido/fotos';
import type { FotoConRuta } from '@/contenido/fotos';
import { cuposLibres } from '@/domain/aforo';
import { hoyIso, sumarDias } from '@/domain/fechas';
import type { Sendero } from '@/domain/sendero';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
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
  const { t } = useIdioma();
  const { alt } = useContenido();
  const mover = (d: number) => setActiva((a) => (a + d + fotos.length) % fotos.length);
  const f = fotos[activa];

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative h-[340px] overflow-hidden rounded-[32px] md:h-[520px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={f.id}
            {...atributosFoto(f, '(min-width: 1024px) 60vw, 100vw')}
            alt={alt(f)}
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
          className="absolute right-4 bottom-4 rounded-full bg-white/90 px-4 py-2.5 text-sm font-bold text-bosque shadow-lg transition-transform hover:scale-105 sm:right-5 sm:bottom-5 sm:px-5"
        >
          {t.ficha.verFotoCompleta}
        </button>
        <span className="absolute top-4 left-4 max-w-[80%] rounded-full bg-bosque/50 px-3 py-1 text-[11px] text-white/90 backdrop-blur sm:top-auto sm:bottom-5 sm:left-5 sm:max-w-[55%] sm:bg-transparent sm:p-0 sm:text-xs sm:backdrop-blur-none">
          {t.ficha.creditoFoto(f.autor, f.licencia)}
        </span>
      </div>
      <div role="group" aria-label={t.ficha.fotosDe(nombre)} className="grid grid-cols-5 gap-3">
        {fotos.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={i === activa}
            aria-label={t.ficha.verFoto(i + 1, alt(x))}
            onClick={() => setActiva(i)}
            className={`relative h-20 overflow-hidden rounded-2xl transition-all md:h-24 ${i === activa ? 'ring-4 ring-lima' : 'opacity-70 hover:opacity-100'}`}
          >
            <img src={x.srcPequena} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialogo abierto={visor} onCerrar={() => setVisor(false)} titulo={alt(f)} ancho="max-w-6xl">
        <div className="relative bg-bosque">
          <img {...atributosFoto(f)} alt={alt(f)} className="max-h-[80vh] w-full object-contain" />
          <div className="flex items-center justify-between gap-4 p-4 text-white">
            <button type="button" onClick={() => mover(-1)} className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20" aria-label={t.ficha.fotoAnterior}>
              ←
            </button>
            <span className="text-center text-sm text-white/80">
              {alt(f)} · {f.autor} ({f.licencia})
            </span>
            <button type="button" onClick={() => mover(1)} className="rounded-full bg-white/10 px-4 py-2 font-bold hover:bg-white/20" aria-label={t.ficha.fotoSiguiente}>
              →
            </button>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}

function Cifra({ titulo, valor, sufijo, texto }: { titulo: string; valor: number | null; sufijo: string; texto?: string }) {
  const { f } = useIdioma();
  return (
    <motion.div variants={itemEscalonado} className="tarjeta flex min-w-0 flex-col gap-1 p-4 sm:p-6">
      <span className="text-sm text-tinta-suave">{titulo}</span>
      <span className="font-cifras text-lg font-black whitespace-nowrap min-[360px]:text-xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl">
        {valor === null ? '—' : Number.isInteger(valor) ? <Contador valor={valor} sufijo={sufijo} /> : `${f.decimal(valor)}${sufijo}`}
      </span>
      {texto && <span className="text-xs text-tinta-suave">{texto}</span>}
    </motion.div>
  );
}

export function FichaSenderoPage() {
  const { senderoId = '' } = useParams();
  const navegar = useNavigate();
  const { senderos } = useServicios();
  const { t, f } = useIdioma();
  const c = useContenido();
  const desde = useMemo(() => sumarDias(hoyIso(), 1), []);
  const catalogo = useConsulta(() => senderos.listar(), [senderos]);
  const dias = useConsulta(() => senderos.disponibilidad(senderoId, desde, DIAS_VISIBLES), [senderos, senderoId, desde]);
  const [fecha, setFecha] = useState<string | null>(null);

  if (catalogo.estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-4 py-20"><Cargando /></div>;
  if (catalogo.estado.tipo === 'error') return <div className="mx-auto max-w-7xl px-4 py-20"><ErrorCarga mensaje={catalogo.estado.mensaje} reintentar={catalogo.recargar} /></div>;

  const indice = catalogo.estado.datos.findIndex((s) => s.id === senderoId);
  const s = indice === -1 ? undefined : c.sendero(catalogo.estado.datos[indice]);
  if (!s) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-5 px-4 py-24">
        <h1 className="m-0 font-display text-4xl font-extrabold">{t.ficha.noEncontrado}</h1>
        <EnlaceBoton to="/senderos" conFlecha>{t.ficha.verTodos}</EnlaceBoton>
      </div>
    );
  }

  const disp = dias.estado.tipo === 'listo' ? dias.estado.datos.find((d) => d.fecha === fecha) : undefined;
  const reservar = () => navegar(`/reservar/${s.id}${fecha ? `?fecha=${fecha}` : ''}`);

  return (
    <div className="pb-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-28 sm:px-8 lg:px-12">
        <nav aria-label={t.ficha.migas} className="text-sm text-tinta-suave">
          <Link to="/">{t.ficha.inicio}</Link> <span aria-hidden="true">/</span> <Link to="/senderos">{t.ficha.senderos}</Link> <span aria-hidden="true">/</span>{' '}
          <span aria-current="page" className="font-semibold text-bosque">{s.nombre}</span>
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[1.4fr_1fr]">
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
              <span className="etiqueta text-tinta-suave">{t.ficha.puntoEncuentro(s.horaSalida)}</span>
              <span className="font-display text-lg font-bold">{s.puntoEncuentro ?? t.ficha.seConfirma}</span>
            </div>
          </Aparecer>
        </div>

        <Escalonado className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Cifra titulo={t.ficha.duracionEstimada} valor={s.duracionHoras} sufijo=" h" />
          <Cifra titulo={t.ficha.longitud} valor={s.distanciaKm} sufijo=" km" />
          <Cifra titulo={t.ficha.desnivelPositivo} valor={s.desnivelM} sufijo=" m" />
          <Cifra titulo={t.ficha.altitudMaxima} valor={s.altitudMaxM} sufijo=" m" texto={t.ficha.sobreNivel} />
        </Escalonado>

        <section aria-labelledby="agenda" className="grid grid-cols-[minmax(0,1fr)] gap-8 rounded-[40px] bg-superficie p-6 shadow-[var(--shadow-tarjeta)] md:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="agenda" className="m-0 font-display text-3xl font-extrabold">{t.ficha.agenda}</h2>
              <span className="flex items-center gap-2 text-sm font-semibold text-tinta">
                <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-ecosistema" /> {t.ficha.cuposVivo}
              </span>
            </div>
            {dias.estado.tipo === 'cargando' && <Cargando texto={t.ficha.consultando} />}
            {dias.estado.tipo === 'error' && <ErrorCarga mensaje={dias.estado.mensaje} reintentar={dias.recargar} />}
            {dias.estado.tipo === 'listo' && <SelectorFecha dias={dias.estado.datos} seleccionada={fecha} onElegir={setFecha} />}
          </div>
          <div className="flex flex-col gap-4 rounded-[28px] bg-bosque p-7 text-white">
            <span className="etiqueta text-lima">{t.ficha.tuFecha}</span>
            <AnimatePresence mode="wait">
              <motion.span key={fecha ?? 'sin'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-display text-3xl font-extrabold">
                {fecha ? f.fecha(fecha) : t.ficha.eligeDia}
              </motion.span>
            </AnimatePresence>
            <dl className="m-0 flex flex-col gap-2.5 border-t border-white/15 pt-4 text-[15px]">
              <div className="flex justify-between gap-3"><dt className="text-white/70">{t.ficha.tarifaVisitante}</dt><dd className="m-0 font-bold">{c.pesos(s.precioPorPersona)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">{t.ficha.guiaLocal}</dt><dd className="m-0 font-bold">{t.ficha.incluido}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">{t.ficha.cuposDia}</dt><dd className="m-0 font-bold">{disp ? cuposLibres(disp) : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/70">{t.ficha.duracionDistancia}</dt><dd className="m-0 font-bold">{c.duracion(s.duracionHoras)} · {t.ficha.desnivelTexto(c.metros(s.desnivelM))}</dd></div>
            </dl>
            <Boton conFlecha disabled={!fecha} onClick={reservar} className="mt-2">
              {t.ficha.continuar}
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
            <span className="text-sm text-white/70">{t.ficha.porPersona(c.pesos(s.precioPorPersona))}</span>
          </div>
          <Boton conFlecha onClick={reservar}>
            {t.ficha.reservarAhora}
          </Boton>
        </div>
      </motion.div>
    </div>
  );
}
