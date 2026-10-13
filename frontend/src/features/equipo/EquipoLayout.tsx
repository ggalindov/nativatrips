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
    <div className="flex min-h-screen flex-wrap bg-arena text-bosque">
      <aside className="flex max-w-none flex-[1_1_240px] flex-col gap-8 bg-bosque px-4 py-7 text-arena md:max-w-[280px]">
        <Link to="/" className="px-3 text-arena no-underline hover:text-arena">
          <Logo lema="Equipo" />
        </Link>
        <nav aria-label="Panel" className="flex flex-col gap-1">
          {MENU[rol].map((m) => (
            <NavLink
              key={m.ruta}
              to={m.ruta}
              end
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-full px-4 text-[15px] no-underline ${
                  isActive ? 'bg-arena font-semibold text-bosque hover:text-bosque' : 'text-salvia-clara hover:bg-arena/5 hover:text-arena'
                }`
              }
            >
              {m.texto}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 px-3 text-sm">
          <span>{sesion?.nombre}</span>
          <span className="font-mono text-[11px] tracking-[0.1em] text-salvia uppercase">{ETIQUETA_ROL[rol]}</span>
          <button type="button" onClick={salir} className="mt-2 min-h-11 bg-transparent p-0 text-left text-sm text-salvia-clara underline">
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-[999_1_560px] px-6 pt-10 pb-16 md:px-12">
        <Outlet />
      </main>
    </div>
  );
}
