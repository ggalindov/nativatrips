import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { RolEquipo } from '@/domain/equipo';
import { ETIQUETA_ROL } from '@/domain/equipo';
import { Logo } from '@/ui/Logo';
import { useSesion } from './SesionContext';

export interface EntradaMenu {
  ruta: string;
  texto: string;
}

const MENU: Record<Exclude<RolEquipo, 'GUIA_TURISTICO'>, EntradaMenu[]> = {
  PERSONAL_ADMINISTRATIVO: [{ ruta: '/equipo/administrativo', texto: 'Hoy' }],
  GERENCIA: [{ ruta: '/equipo/gerencia', texto: 'Resumen' }],
};

/** Marco de escritorio con menú lateral para administrativo y gerencia. */
export function EquipoLayout({ rol }: { rol: Exclude<RolEquipo, 'GUIA_TURISTICO'> }) {
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();
  const salir = () => {
    cerrar();
    navegar('/equipo/acceso', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-arena text-bosque lg:flex-row">
      <aside className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-bosque px-4 py-4 text-arena lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:flex-none lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-8 lg:py-7">
        <Link to="/" className="px-3 text-arena no-underline hover:text-arena">
          <Logo lema="Equipo" />
        </Link>
        <nav aria-label="Panel" className="order-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:flex-col lg:overflow-visible">
          {MENU[rol].map((m) => (
            <NavLink
              key={m.ruta}
              to={m.ruta}
              end
              className={({ isActive }) =>
                `flex min-h-11 flex-none items-center rounded-full px-4 text-[15px] whitespace-nowrap no-underline ${
                  isActive ? 'bg-arena font-semibold text-bosque hover:text-bosque' : 'text-salvia-clara hover:bg-arena/5 hover:text-arena'
                }`
              }
            >
              {m.texto}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex flex-col items-end gap-0.5 px-3 text-right text-sm lg:mt-auto lg:ml-0 lg:items-start lg:gap-1 lg:text-left">
          <span>{sesion?.nombre}</span>
          <span className="font-mono text-[11px] tracking-[0.1em] text-salvia uppercase">{ETIQUETA_ROL[rol]}</span>
          <button type="button" onClick={salir} className="min-h-11 bg-transparent p-0 text-sm text-salvia-clara underline lg:mt-2 lg:text-left">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-8 pb-16 sm:px-6 md:px-10 lg:px-12 lg:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
