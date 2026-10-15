import { Suspense } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { useIdioma } from '@/i18n/IdiomaContext';
import { SelectorIdioma } from '@/i18n/SelectorIdioma';
import { perezosa } from '@/app/perezosa';
import { CargandoPagina } from '@/ui/Estados';
import { Logo } from '@/ui/Logo';
import { CURVA } from '@/ui/movimiento';
import { BarraNavegacion } from './BarraNavegacion';

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
      <Suspense fallback={<CargandoPagina />}>{salida}</Suspense>
    </motion.div>
  );
}

/** El asistente no hace falta para ver la página: su código llega después. */
const Asistente = perezosa(() => import('@/features/asistente/Asistente').then((m) => m.Asistente));

const ENLACE_PIE = 'inline-flex min-h-8 items-center text-white/80 no-underline hover:text-white';

export function SitioLayout() {
  const { t } = useIdioma();
  return (
    <div className="flex min-h-screen flex-col bg-arena text-bosque">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-lima focus:px-4 focus:py-2 focus:text-bosque">
        {t.comun.saltarContenido}
      </a>
      <BarraNavegacion />

      <main id="contenido" className="flex-1">
        <Transicion />
      </main>

      <footer className="relative overflow-hidden bg-bosque text-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 text-sm sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:px-12">
          <div className="flex flex-col gap-4">
            <Logo lema={t.pie.lema} />
            <p className="m-0 max-w-sm leading-relaxed">{t.pie.descripcion}</p>
            <div className="flex flex-col gap-2 pt-2">
              <span className="etiqueta text-lima">{t.comun.idioma}</span>
              <SelectorIdioma variante="lista" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="etiqueta text-lima">{t.pie.explora}</span>
            <Link className={ENLACE_PIE} to="/senderos">{t.nav.enlaces.senderos.texto}</Link>
            <Link className={ENLACE_PIE} to="/biblioteca">{t.nav.enlaces.biblioteca.texto}</Link>
            <Link className={ENLACE_PIE} to="/antes-de-subir">{t.nav.enlaces.antes.texto}</Link>
            <Link className={ENLACE_PIE} to="/mi-reserva">{t.nav.enlaces.miReserva.texto}</Link>
            <Link className={ENLACE_PIE} to="/#como-llegar">{t.pie.comoLlegar}</Link>
            <Link className={ENLACE_PIE} to="/creditos">{t.pie.creditos}</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="etiqueta text-lima">Eco Palacio Tur S.A.S.</span>
            <span>La Calera, Cundinamarca</span>
            <span>RNT [NÚMERO]</span>
            <span>[CORREO DE CONTACTO] · [TELÉFONO]</span>
            <Link className="mt-2 inline-flex min-h-8 items-center text-white/60 no-underline hover:text-white" to="/equipo/acceso">{t.pie.accesoEquipo}</Link>
          </div>
        </div>
        <div className="border-t border-bosque-2 py-5 text-center text-xs text-white/50">{t.pie.derechos(new Date().getFullYear())}</div>
      </footer>
      <Suspense fallback={null}>
        <Asistente />
      </Suspense>
    </div>
  );
}
