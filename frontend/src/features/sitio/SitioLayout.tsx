import { Link, NavLink, Outlet } from 'react-router-dom';
import { EnlaceBoton } from '@/ui/Boton';
import { Logo } from '@/ui/Logo';

const enlaceNav = 'text-white/80 no-underline transition-colors hover:text-white';
const enlaceNavActivo = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-bold text-lima no-underline hover:text-lima' : enlaceNav;

export function SitioLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-arena text-bosque">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-lima focus:px-4 focus:py-2 focus:text-bosque">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-bosque-2 bg-bosque/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5 sm:px-8 lg:px-12">
          <Link to="/" aria-label="NativaTrips, inicio" className="no-underline">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium lg:flex">
            <a className={enlaceNav} href="/#senderos">
              Senderos
              <span className="ml-1.5 rounded-full border border-lima/30 bg-lima/20 px-2 py-0.5 text-[10px] font-bold text-lima">13</span>
            </a>
            <a className={enlaceNav} href="/#reservar">Cómo reservar</a>
            <a className={enlaceNav} href="/#antes">Antes de subir</a>
            <NavLink className={enlaceNavActivo} to="/mi-reserva">
              Mi reserva
            </NavLink>
          </nav>
          <EnlaceBoton to="/reservar" conFlecha className="h-10 px-6 text-sm">
            Reservar
          </EnlaceBoton>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-bosque text-white/70">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-10 px-4 py-14 text-sm sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4">
            <Logo />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-white">Eco Palacio Tur S.A.S.</span>
              <span>La Calera, Cundinamarca · RNT [NÚMERO]</span>
              <span>[CORREO DE CONTACTO] · [TELÉFONO]</span>
            </div>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap items-start gap-6">
            <Link className={enlaceNav} to="/mi-reserva">Mi reserva</Link>
            <a className={enlaceNav} href="/#antes">Antes de subir</a>
            <Link className={enlaceNav} to="/equipo/acceso">Acceso equipo</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
