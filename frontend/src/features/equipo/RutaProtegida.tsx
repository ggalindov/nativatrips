import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RolEquipo } from '@/domain/equipo';
import { RUTA_PANEL } from '@/domain/equipo';
import { useSesion } from './SesionContext';

/**
 * Deja pasar solo a la sesión con el rol indicado. Sin sesión, va al acceso;
 * con otro rol, a su propio panel.
 */
export function RutaProtegida({ rol }: { rol: RolEquipo }) {
  const { sesion } = useSesion();
  const ubicacion = useLocation();
  if (!sesion) return <Navigate to="/equipo/acceso" replace state={{ desde: ubicacion.pathname }} />;
  if (sesion.rol !== rol) return <Navigate to={RUTA_PANEL[sesion.rol]} replace />;
  return <Outlet />;
}
