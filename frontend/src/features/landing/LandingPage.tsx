import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { foto } from '@/contenido/fotos';
import { hoyIso, sumarDias } from '@/domain/fechas';
import type { Dificultad, Sendero } from '@/domain/sendero';
import { DIFICULTADES, filtrarPorDificultad, ordenarPorExigencia } from '@/domain/sendero';
import { Carrusel } from '@/features/biblioteca/Carrusel';
import { TarjetaSendero } from '@/features/senderos/TarjetaSendero';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { Boton, EnlaceBoton, FlechaAccion } from '@/ui/Boton';
import { Contornos } from '@/ui/Contornos';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, Contador, Escalonado, FotoAnimada, itemEscalonado } from '@/ui/movimiento';
import { Descenso } from './Descenso';
import { VideoPaisajes } from './VideoPaisajes';

function Encabezado({ antetitulo, titulo, oscuro = false, centrado = false }: { antetitulo: string; titulo: string; oscuro?: boolean; centrado?: boolean }) {
  return (
    <Aparecer className={`flex flex-col gap-3 ${centrado ? 'items-center text-center' : ''}`}>
      <span className={`etiqueta ${oscuro ? 'text-lima' : 'text-tinta-suave'}`}>{antetitulo}</span>
      <h2 className={`m-0 max-w-3xl font-display text-4xl leading-none font-extrabold tracking-tight md:text-[56px] ${oscuro ? 'text-white' : ''}`}>
        {titulo}
      </h2>
    </Aparecer>
  );
}

function Cifras() {
  const cifras = [
    { valor: 13, sufijo: '', titulo: 'Rutas habilitadas', texto: 'Páramo y bosque andino' },
    { valor: 3820, sufijo: ' m', titulo: 'Altitud máxima', texto: 'Cuchilla el Zaque' },
    { valor: 100, sufijo: ' %', titulo: 'Confirmación digital', texto: 'Sin papeles ni filas' },
    { valor: 0, sufijo: '', titulo: 'Cuentas que crear', texto: 'Reservas como invitado' },
  ];
  return (
    <section aria-label="NativaTrips en cifras" className="relative z-10 -mt-px bg-bosque">
      <Escalonado como="dl" className="mx-auto m-0 grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 py-14 sm:px-8 md:grid-cols-4 lg:px-12">
        {cifras.map((c) => (
          <motion.div key={c.titulo} variants={itemEscalonado} className="flex flex-col-reverse gap-1.5 border-l border-bosque-3 px-5 py-2">
            <dt className="flex flex-col">
              <span className="font-display text-base font-bold text-white">{c.titulo}</span>
              <span className="text-sm text-white/60">{c.texto}</span>
            </dt>
            <dd className="m-0 font-cifras text-3xl font-black text-lima-suave md:text-4xl">
              <Contador valor={c.valor} sufijo={c.sufijo} />
            </dd>
          </motion.div>
        ))}
      </Escalonado>
    </section>
  );
}

function Destacados({ senderos }: { senderos: readonly Sendero[] }) {
  const [filtro, setFiltro] = useState<Dificultad | null>(null);
  const visibles = useMemo(() => filtrarPorDificultad(ordenarPorExigencia(senderos), filtro).slice(0, 6), [senderos, filtro]);
  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Filtrar por dificultad" className="flex flex-wrap gap-2">
        {[null, ...DIFICULTADES].map((d) => {
          const activo = filtro === d;
          return (
            <button
              key={d ?? 'todas'}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(d)}
              className={`relative h-10 rounded-full px-5 text-sm font-semibold transition-colors ${activo ? 'text-lima' : 'text-bosque hover:bg-bosque/5'}`}
            >
              {activo && <motion.span layoutId="filtro-activo" className="absolute inset-0 rounded-full bg-bosque" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{d ?? 'Todas'}</span>
            </button>
          );
        })}
      </div>
      <Escalonado key={filtro ?? 'todas'} como="ul" className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((s, i) => (
          <TarjetaSendero key={s.id} sendero={s} numero={i + 1} />
        ))}
      </Escalonado>
      <Aparecer className="flex justify-center pt-4">
        <EnlaceBoton to="/senderos" variante="oscuro" conFlecha>
          Ver el catálogo completo de 13 senderos
        </EnlaceBoton>
      </Aparecer>
    </div>
  );
}

function GuiaVisita() {
  const f = foto('espeletias-laguna');
  const pautas = [
    ['Capas de ropa', 'Térmica, polar e impermeable. En minutos se pasa del sol a la lluvia.'],
    ['Agua y comida ligera', 'Al menos 1,5 litros por persona y snacks de energía.'],
    ['Ritmo constante', 'Pasos cortos para que el cuerpo se adapte a la altura.'],
    ['Sin huella', 'Toda la basura vuelve contigo. No se toca ni se arranca nada.'],
  ];
  return (
    <section id="antes" className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-28 sm:px-8 lg:grid-cols-2 lg:px-12">
      <Aparecer className="relative">
        <div className="relative h-[520px] overflow-hidden rounded-[40px] shadow-2xl">
          <FotoAnimada src={f.src} alt={f.alt} kenBurns />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -6 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.3 }}
          className="absolute -right-3 -bottom-6 flex flex-col gap-1 rounded-3xl bg-lima px-6 py-5 text-bosque shadow-xl md:-right-8"
        >
          <span className="etiqueta">Altitud regulada</span>
          <span className="font-cifras text-3xl font-black">3.900 m</span>
          <span className="text-xs font-semibold">sobre el nivel del mar</span>
        </motion.div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 -left-3 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-sm font-bold text-bosque shadow-lg md:-left-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          </svg>
          Niebla frecuente en la tarde
        </motion.div>
      </Aparecer>
      <div className="flex flex-col gap-8">
        <Encabezado antetitulo="Guía de visita" titulo="Arriba hace frío, y el aire es otro." />
        <Escalonado como="ul" className="m-0 flex list-none flex-col gap-3 p-0">
          {pautas.map(([t, d], i) => (
            <motion.li key={t} variants={itemEscalonado} className="tarjeta flex items-start gap-4 px-5 py-4">
              <span className="flex size-10 flex-none items-center justify-center rounded-2xl bg-bosque font-cifras text-sm font-black text-lima">{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-lg font-bold">{t}</span>
                <span className="text-[15px] leading-relaxed text-tinta">{d}</span>
              </div>
            </motion.li>
          ))}
        </Escalonado>
        <Aparecer>
          <Link to="/antes-de-subir" className="inline-flex items-center gap-2 font-display font-bold">
            Ver la guía completa: equipaje, altura y normas <FlechaAccion />
          </Link>
        </Aparecer>
      </div>
    </section>
  );
}

function ReservaRapida({ senderos }: { senderos: readonly Sendero[] }) {
  const navegar = useNavigate();
  const manana = useMemo(() => sumarDias(hoyIso(), 1), []);
  const [senderoId, setSenderoId] = useState('lagunas-de-siecha');
  const [fecha, setFecha] = useState(manana);
  const ir = (e: FormEvent) => {
    e.preventDefault();
    navegar(`/reservar/${senderoId}?fecha=${fecha}`);
  };
  const campo = 'h-14 w-full rounded-2xl border border-white/15 bg-bosque-2 px-4 text-base text-white focus:border-lima focus:outline-none';
  return (
    <section id="reservar" className="px-4 py-10 sm:px-8 lg:px-12">
      <Aparecer className="relative mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-[40px] bg-bosque px-6 py-16 text-white md:px-14 md:py-20 lg:grid-cols-2">
        <Contornos className="opacity-40" />
        <div className="relative flex flex-col gap-6">
          <span className="etiqueta text-lima">Reserva rápida</span>
          <h2 className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight md:text-[52px]">Sin cuentas. Sin contraseñas.</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-white/80">
            {['Eliges sendero y fecha y ves los cupos del día.', 'Pagas con PayU: tarjeta, PSE o efectivo.', 'Recibes un enlace al correo para gestionar tu reserva.'].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 flex size-5 flex-none items-center justify-center rounded-full bg-lima text-xs font-black text-bosque">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={ir} className="relative flex flex-col gap-4 rounded-[32px] border border-white/10 bg-bosque-2/70 p-6 backdrop-blur md:p-8">
          <label className="flex flex-col gap-2">
            <span className="etiqueta text-white/70">Sendero</span>
            <select value={senderoId} onChange={(e) => setSenderoId(e.target.value)} className={campo}>
              {ordenarPorExigencia(senderos).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.dificultad}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="etiqueta text-white/70">Fecha de visita</span>
            <input type="date" min={manana} value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${campo} [color-scheme:dark]`} />
          </label>
          <Boton type="submit" conFlecha className="mt-2 h-14 text-base">
            Ver cupos y reservar
          </Boton>
        </form>
      </Aparecer>
    </section>
  );
}

function Galeria() {
  return (
    <section aria-labelledby="galeria-titulo" className="flex flex-col gap-10 py-24">
      <div className="mx-auto grid w-full max-w-7xl items-end gap-6 px-4 sm:px-8 md:grid-cols-[1.3fr_1fr] lg:px-12">
        <Aparecer className="flex flex-col gap-3">
          <span className="etiqueta text-tinta-suave">Vida en el páramo</span>
          <h2 id="galeria-titulo" className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight md:text-[56px]">
            Lo que cuida cada cupo que no se vende.
          </h2>
        </Aparecer>
        <Aparecer retraso={0.1} className="flex flex-col items-start gap-3">
          <p className="m-0 text-[17px] leading-relaxed text-tinta">Desliza, toca para ampliar o abre la biblioteca completa de fotos y videos.</p>
          <EnlaceBoton to="/biblioteca" variante="oscuro" conFlecha>
            Abrir la biblioteca
          </EnlaceBoton>
        </Aparecer>
      </div>
      <Carrusel />
      <p className="mx-auto m-0 text-xs text-tinta-suave">
        Fotografías de Eco Palacio Tur y de Wikimedia Commons con licencia libre · <Link to="/creditos">Ver créditos</Link>
      </p>
    </section>
  );
}

export function LandingPage() {
  const { senderos } = useServicios();
  const { estado, recargar } = useConsulta(() => senderos.listar(), [senderos]);
  const lista = estado.tipo === 'listo' ? estado.datos : [];

  return (
    <>
      <Descenso />
      <Cifras />
      <VideoPaisajes />

      <section id="senderos" aria-label="Rutas para conectar con el páramo" className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-28 pb-16 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
          <Encabezado antetitulo="Experiencias y senderos" titulo="Rutas para conectar con el páramo." />
          <Aparecer retraso={0.1}>
            <p className="m-0 text-[17px] leading-relaxed text-tinta">
              Cada sendero tiene un aforo diario fijado con el parque. Cuando se llena, se cierra la fecha: así el páramo se
              recupera entre grupos.
            </p>
          </Aparecer>
        </div>
        {estado.tipo === 'cargando' && <Cargando texto="Cargando senderos…" />}
        {estado.tipo === 'error' && <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />}
        {estado.tipo === 'listo' && <Destacados senderos={lista} />}
      </section>

      <GuiaVisita />
      {lista.length > 0 && <ReservaRapida senderos={lista} />}
      <Galeria />
    </>
  );
}
