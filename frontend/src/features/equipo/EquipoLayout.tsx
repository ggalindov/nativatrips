import { Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ETIQUETA_ROL } from '@/domain/equipo';
import { CargandoPagina } from '@/ui/Estados';
import { Logo } from '@/ui/Logo';
import { CURVA } from '@/ui/movimiento';
import { NOTIFICACIONES } from './ejemplo';
import { useSesion } from './SesionContext';
import { AvisoProvider } from './ui';

const icono = (d: string) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const ICONOS = {
  hoy: icono('M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'),
  reservas: icono('M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 13h3M8 16h6'),
  salidas: icono('M4 19l5-12 4 7 2-3 5 8zM9 4.5a1.5 1.5 0 1 0 0-.1'),
  capacidad: icono('M4 20h16M6 16V10M10 16V6M14 16v-4M18 16V8'),
  senderos: icono('M5 20c3-1 4-4 7-6s5-3 7-8M5 20h.01M19 6h.01'),
  chat: icono('M4 5h16v11H9l-5 4zM8 10h8M8 13h5'),
  reportes: icono('M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6'),
  recomendaciones: icono('M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z'),
  resumen: icono('M4 13h4v7H4zM10 8h4v12h-4zM16 4h4v16h-4z'),
  biblioteca: icono('M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5h.01'),
  equipo: icono('M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.2a3.5 3.5 0 0 1 0 6.6M18 14a6 6 0 0 1 3.5 6'),
};

interface EntradaMenu {
  ruta: string;
  texto: string;
  icono: ReactNode;
}

/** Menú del administrador, agrupado por tipo de trabajo. */
const MENU: { grupo: string; entradas: EntradaMenu[] }[] = [
  {
    grupo: 'Operación',
    entradas: [
      { ruta: '/equipo/admin', texto: 'Hoy', icono: ICONOS.hoy },
      { ruta: '/equipo/admin/reservas', texto: 'Reservas', icono: ICONOS.reservas },
      { ruta: '/equipo/admin/salidas', texto: 'Salidas y guías', icono: ICONOS.salidas },
      { ruta: '/equipo/admin/capacidad', texto: 'Capacidad', icono: ICONOS.capacidad },
      { ruta: '/equipo/admin/conversaciones', texto: 'Conversaciones', icono: ICONOS.chat },
    ],
  },
  {
    grupo: 'Contenido del sitio',
    entradas: [
      { ruta: '/equipo/admin/recorridos', texto: 'Recorridos', icono: ICONOS.senderos },
      { ruta: '/equipo/admin/biblioteca', texto: 'Biblioteca', icono: ICONOS.biblioteca },
      { ruta: '/equipo/admin/recomendaciones', texto: 'Recomendaciones', icono: ICONOS.recomendaciones },
    ],
  },
  {
    grupo: 'Indicadores',
    entradas: [
      { ruta: '/equipo/admin/resumen', texto: 'Resumen del mes', icono: ICONOS.resumen },
      { ruta: '/equipo/admin/reportes', texto: 'Reporte ambiental', icono: ICONOS.reportes },
    ],
  },
  {
    grupo: 'Accesos',
    entradas: [{ ruta: '/equipo/admin/usuarios', texto: 'Usuarios', icono: ICONOS.equipo }],
  },
];

/** Notificaciones del personal (RF-08: reservas nuevas sin recargar, alertas de capacidad, chats derivados). */
function Notificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [leidas, setLeidas] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);
  const color = { reserva: 'bg-[#3a8a5c]', alerta: 'bg-advertencia', chat: 'bg-lima', revision: 'bg-salvia' } as const;
  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-label={`Notificaciones${leidas ? '' : `, ${NOTIFICACIONES.length} nuevas`}`}
        onClick={() => {
          setAbierto((a) => !a);
          setLeidas(true);
        }}
        className="relative flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {!leidas && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-lima font-mono text-[10px] font-bold text-bosque">
            {NOTIFICACIONES.length}
          </span>
        )}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: CURVA }}
            className="absolute top-[calc(100%+8px)] right-0 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-superficie text-bosque shadow-2xl lg:right-auto lg:left-0"
          >
            <div className="border-b linea px-5 py-3 font-display font-bold">Notificaciones</div>
            <ul className="m-0 list-none p-0">
              {NOTIFICACIONES.map((n) => (
                <li key={n.id} className="flex gap-3 border-b linea px-5 py-3 last:border-0">
                  <span aria-hidden="true" className={`mt-1.5 size-2 flex-none rounded-full ${color[n.tipo]}`} />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm">{n.texto}</span>
                    <span className="text-xs text-tinta-suave">{n.hace}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Marco de escritorio con menú lateral para el administrador. */
export function EquipoLayout() {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();
  const salir = () => {
    cerrar();
    navegar('/equipo/acceso', { replace: true });
  };
  const inicial = sesion?.nombre?.[0] ?? '·';

  return (
    <AvisoProvider>
      <div className="flex min-h-screen flex-col bg-arena text-bosque lg:flex-row">
        <aside className="flex flex-wrap items-center gap-x-3 gap-y-3 bg-bosque px-4 py-4 text-arena lg:sticky lg:top-0 lg:h-screen lg:w-[264px] lg:flex-none lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-5 lg:overflow-y-auto lg:py-7">
          <div className="flex flex-1 items-center justify-between gap-3 lg:flex-none">
            <Link to="/" className="px-1 text-arena no-underline hover:text-arena lg:px-3">
              <Logo lema="Equipo" />
            </Link>
            <Notificaciones />
          </div>
          <nav aria-label="Panel" className="order-3 flex w-full gap-1 overflow-x-auto [scrollbar-width:none] lg:order-none lg:flex-col lg:overflow-visible">
            {MENU.map(({ grupo, entradas }) => (
              <div key={grupo} className="flex flex-none gap-1 lg:flex-col">
                <span aria-hidden="true" className="hidden px-4 pt-3 pb-1 font-mono text-[10px] tracking-[0.14em] text-salvia uppercase lg:block">
                  {grupo}
                </span>
                {entradas.map((m) => (
                  <NavLink
                    key={m.ruta}
                    to={m.ruta}
                    end={m.ruta === '/equipo/admin'}
                    className={({ isActive }) =>
                      `flex min-h-11 flex-none items-center gap-3 rounded-full px-4 text-[15px] whitespace-nowrap no-underline transition-colors ${
                        isActive ? 'bg-arena font-semibold text-bosque hover:text-bosque' : 'text-salvia-clara hover:bg-arena/5 hover:text-arena'
                      }`
                    }
                  >
                    {m.icono}
                    {m.texto}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-3 rounded-3xl lg:mt-auto lg:bg-white/5 lg:p-3">
            <span
              aria-hidden="true"
              className="hidden size-10 flex-none items-center justify-center rounded-full bg-lima font-display font-extrabold text-bosque lg:flex"
            >
              {inicial}
            </span>
            <div className="flex min-w-0 flex-col text-sm">
              <span className="truncate">{sesion?.nombre}</span>
              <span className="font-mono text-[10px] tracking-[0.1em] text-salvia uppercase">{ETIQUETA_ROL.ADMINISTRADOR}</span>
            </div>
            <button type="button" onClick={salir} className="ml-auto min-h-11 bg-transparent px-2 text-sm text-salvia-clara underline hover:text-white">
              Salir
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-6 md:px-10 lg:px-12 lg:pt-10">
          <Suspense fallback={<CargandoPagina />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </AvisoProvider>
  );
}
