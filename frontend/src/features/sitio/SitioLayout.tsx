import { motion } from 'motion/react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
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
      {salida}
    </motion.div>
  );
}

export function SitioLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-arena text-bosque">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-lima focus:px-4 focus:py-2 focus:text-bosque">
        Saltar al contenido
      </a>
      <BarraNavegacion />

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
            <Link className="text-white/80 no-underline hover:text-white" to="/biblioteca">Biblioteca</Link>
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
