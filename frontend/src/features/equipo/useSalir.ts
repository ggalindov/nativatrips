import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServicios } from '@/services/ServiciosContext';
import { useSesion } from './SesionContext';

/**
 * Cierra la sesión del equipo: primero revoca el token en el servidor (BUG-02) y
 * luego lo olvida en el navegador. Si el servidor no responde, la sesión igual se
 * cierra aquí; el token vence solo a la hora.
 */
export function useSalir(): () => Promise<void> {
  const { autenticacion } = useServicios();
  const { cerrar } = useSesion();
  const navegar = useNavigate();

  return useCallback(async () => {
    try {
      await autenticacion.cerrarSesion();
    } catch {
      /* sin conexión: se cierra igual en el navegador */
    } finally {
      cerrar();
      navegar('/equipo/acceso', { replace: true });
    }
  }, [autenticacion, cerrar, navegar]);
}
