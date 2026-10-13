/** Roles del personal, alineados con Rol del backend (el turista no inicia sesión). */
export type RolEquipo = 'PERSONAL_ADMINISTRATIVO' | 'GUIA_TURISTICO' | 'GERENCIA';

export const ETIQUETA_ROL: Record<RolEquipo, string> = {
  PERSONAL_ADMINISTRATIVO: 'Personal administrativo',
  GUIA_TURISTICO: 'Guía',
  GERENCIA: 'Gerencia',
};

/** Panel al que entra cada rol después de iniciar sesión. */
export const RUTA_PANEL: Record<RolEquipo, string> = {
  PERSONAL_ADMINISTRATIVO: '/equipo/administrativo',
  GUIA_TURISTICO: '/equipo/guia',
  GERENCIA: '/equipo/gerencia',
};

export interface SesionEquipo {
  nombre: string;
  correo: string;
  rol: RolEquipo;
  token: string;
}

export function esRolEquipo(valor: string): valor is RolEquipo {
  return valor === 'PERSONAL_ADMINISTRATIVO' || valor === 'GUIA_TURISTICO' || valor === 'GERENCIA';
}
