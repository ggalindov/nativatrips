import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { EnlaceBoton } from '@/ui/Boton';
import { Logo } from '@/ui/Logo';
import { CURVA } from '@/ui/movimiento';

const ENLACES = [
  { a: '/senderos', texto: 'Senderos', insignia: '13' },
  { a: '/antes-de-subir', texto: 'Antes de subir' },
  { a: '/mi-reserva', texto: 'Mi reserva' },
];

function claseEnlace({ isActive }: { isActive: boolean }) {
  return `relative py-1 no-underline transition-colors ${isActive ? 'font-bold text-lima hover:text-lima' : 'text-white/80 hover:text-white'}`;
}

/**
 * Transición entre páginas: cada página nueva entra con fundido y un leve
 * ascenso. No hay animación de salida a propósito: la página saliente se
 * volvería a renderizar con la URL nueva y podría redirigir por error.
 */
function Transicion() {
  const { pathname } = useLocation();
  const salida = useOutlet();
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: CURVA }}>
      {salida}
    </motion.div>
  );
}

export function SitioLayout() {
  const { scrollYProgress } = useScroll();
  const barra = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-arena text-bosque">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-lima focus:px-4 focus:py-2 focus:text-bosque">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-bosque-2 bg-bosque/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="NativaTrips, inicio" className="no-underline">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium lg:flex">
            {ENLACES.map((e) => (
              <NavLink key={e.a} to={e.a} className={claseEnlace}>
                {({ isActive }) => (
                  <>
                    {e.texto}
                    {e.insignia && (
                      <span className="ml-1.5 rounded-full border border-lima/30 bg-lima/20 px-2 py-0.5 text-[10px] font-bold text-lima">{e.insignia}</span>
                    )}
                    {isActive && <motion.span layoutId="nav-activo" className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-lima" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block">
              <EnlaceBoton to="/reservar" conFlecha className="h-10 px-6 text-sm">
                Reservar
              </EnlaceBoton>
            </span>
            <button
              type="button"
              aria-expanded={menu}
              aria-controls="menu-movil"
              aria-label="Menú"
              onClick={() => setMenu((m) => !m)}
              className="flex size-10 items-center justify-center rounded-full bg-bosque-2 text-white lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                {menu ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav
              id="menu-movil"
              aria-label="Principal móvil"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: CURVA }}
              className="overflow-hidden border-t border-bosque-2 lg:hidden"
            >
              <ul className="m-0 flex list-none flex-col gap-1 px-4 py-4">
                {ENLACES.map((e) => (
                  <li key={e.a}>
                    <NavLink to={e.a} className={({ isActive }) => `block rounded-2xl px-4 py-3 text-base no-underline ${isActive ? 'bg-lima text-bosque' : 'text-white hover:bg-bosque-2'}`}>
                      {e.texto}
                    </NavLink>
                  </li>
                ))}
                <li className="pt-2 sm:hidden">
                  <EnlaceBoton to="/reservar" conFlecha className="w-full">
                    Reservar un sendero
                  </EnlaceBoton>
                </li>
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
        <motion.div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-lima" style={{ scaleX: barra }} />
      </header>

      <main id="contenido" className="flex-1">
        <Transicion />
      </main>

      <footer className="relative overflow-hidden bg-bosque text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 text-sm sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:px-12">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="m-0 max-w-sm leading-relaxed">
              Reservas de ecoturismo en el Parque Nacional Natural Chingaza, con cupos regulados por la capacidad de carga de cada sendero.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="etiqueta text-lima">Explora</span>
            <Link className="text-white/80 no-underline hover:text-white" to="/senderos">Senderos</Link>
            <Link className="text-white/80 no-underline hover:text-white" to="/antes-de-subir">Antes de subir</Link>
            <Link className="text-white/80 no-underline hover:text-white" to="/mi-reserva">Mi reserva</Link>
            <Link className="text-white/80 no-underline hover:text-white" to="/creditos">Créditos fotográficos</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="etiqueta text-lima">Eco Palacio Tur S.A.S.</span>
            <span>La Calera, Cundinamarca</span>
            <span>RNT [NÚMERO]</span>
            <span>[CORREO DE CONTACTO] · [TELÉFONO]</span>
            <Link className="mt-2 text-white/60 no-underline hover:text-white" to="/equipo/acceso">Acceso equipo</Link>
          </div>
        </div>
        <div className="border-t border-bosque-2 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} NativaTrips · Turismo responsable en el páramo</div>
      </footer>
    </div>
  );
}
