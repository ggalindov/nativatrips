import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { foto } from '@/contenido/fotos';
import { useIdioma } from '@/i18n/IdiomaContext';
import { SelectorIdioma } from '@/i18n/SelectorIdioma';
import { BotonReservar } from '@/ui/BotonReservar';
import { Logo } from '@/ui/Logo';
import { CURVA } from '@/ui/movimiento';

const ENLACES = [
  { a: '/senderos', clave: 'senderos' },
  { a: '/biblioteca', clave: 'biblioteca' },
  { a: '/antes-de-subir', clave: 'antes' },
  { a: '/mi-reserva', clave: 'miReserva' },
] as const;

/**
 * Barra flotante en forma de cápsula. Transparente sobre la portada, sólida al
 * bajar; siempre visible mientras se hace scroll.
 */
export function BarraNavegacion() {
  const { pathname } = useLocation();
  const { t } = useIdioma();
  const { scrollY, scrollYProgress } = useScroll();
  const progreso = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [arriba, setArriba] = useState(true);
  const [menu, setMenu] = useState(false);
  const [sobre, setSobre] = useState<string | null>(null);

  useMotionValueEvent(scrollY, 'change', (y) => setArriba(y < 40));

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = menu ? 'hidden' : '';
  }, [menu]);

  const transparente = pathname === '/' && arriba && !menu;

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: CURVA }}
        className="fixed inset-x-0 top-3 z-50 flex justify-center px-3"
      >
        <div
          className={`relative flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border py-2 pr-2 pl-4 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 ${
            transparente ? 'border-white/15 bg-bosque/25' : 'border-white/10 bg-bosque/85 shadow-[0_18px_40px_-18px_rgb(19_32_26/0.7)]'
          }`}
        >
          <Link to="/" aria-label={t.nav.inicio} className="no-underline">
            <Logo compacto firma />
          </Link>

          <nav aria-label={t.nav.principal} className="hidden items-center lg:flex" onMouseLeave={() => setSobre(null)}>
            {ENLACES.map((e) => (
              <NavLink
                key={e.a}
                to={e.a}
                onMouseEnter={() => setSobre(e.a)}
                onFocus={() => setSobre(e.a)}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${isActive ? 'text-lima hover:text-lima' : 'text-white/80 hover:text-white'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {sobre === e.a && (
                      <motion.span layoutId="nav-sobre" className="absolute inset-0 rounded-full bg-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative">{t.nav.enlaces[e.clave].texto}</span>
                    {isActive && <motion.span layoutId="nav-activo" className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lima" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <SelectorIdioma />
            </div>
            <div className="hidden sm:block">
              <BotonReservar to="/reservar">{t.nav.reservar}</BotonReservar>
            </div>
            <button
              type="button"
              aria-expanded={menu}
              aria-controls="menu-pantalla"
              aria-label={menu ? t.nav.cerrarMenu : t.nav.abrirMenu}
              onClick={() => setMenu((m) => !m)}
              className="relative flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 lg:hidden"
            >
              <span className="relative block h-3 w-5">
                <motion.span animate={menu ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} className="absolute top-0 left-0 h-0.5 w-5 rounded-full bg-current" />
                <motion.span animate={menu ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} className="absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>
          </div>

          <motion.span aria-hidden="true" style={{ scaleX: progreso }} className="absolute inset-x-6 bottom-0 h-px origin-left bg-lima/80" />
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="menu-pantalla"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 36px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 36px)' }}
            transition={{ duration: 0.7, ease: CURVA }}
            className="fixed inset-0 z-40 flex flex-col justify-end overflow-hidden bg-bosque px-6 pt-28 pb-12 text-white lg:hidden"
          >
            <img src={foto('desde-las-nubes').src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <nav aria-label={t.nav.principalMovil} className="relative flex flex-col gap-2">
              {ENLACES.map((e, i) => (
                <motion.div key={e.a} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08, duration: 0.6, ease: CURVA }}>
                  <NavLink to={e.a} className={({ isActive }) => `group flex flex-col border-b border-white/10 py-4 no-underline ${isActive ? 'text-lima' : 'text-white'}`}>
                    <span className="font-display text-4xl font-extrabold tracking-tight">{t.nav.enlaces[e.clave].texto}</span>
                    <span className="text-sm text-white/60">{t.nav.enlaces[e.clave].detalle}</span>
                  </NavLink>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6, ease: CURVA }} className="flex flex-col gap-5 pt-6">
                <BotonReservar to="/reservar" tamano="amplio" className="w-full">
                  {t.nav.reservarSendero}
                </BotonReservar>
                <SelectorIdioma variante="lista" />
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
