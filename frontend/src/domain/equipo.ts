/**
 * Roles del personal (el turista no inicia sesión). Administración y gerencia
 * son un mismo rol: el administrador ve la operación, los indicadores y edita
 * todo el contenido; el guía solo su agenda y sus grupos.
 */
export type RolEquipo = 'ADMINISTRADOR' | 'GUIA_TURISTICO';

export const ROLES_EQUIPO: readonly RolEquipo[] = ['ADMINISTRADOR', 'GUIA_TURISTICO'];

export const ETIQUETA_ROL: Record<RolEquipo, string> = {
  ADMINISTRADOR: 'Administrador',
  GUIA_TURISTICO: 'Guía',
};

/** Panel al que entra cada rol después de iniciar sesión. */
export const RUTA_PANEL: Record<RolEquipo, string> = {
  ADMINISTRADOR: '/equipo/admin',
  GUIA_TURISTICO: '/equipo/guia',
};

/** Mínimo de la contraseña del equipo; el backend exige lo mismo. */
export const LARGO_MINIMO_CLAVE = 8;

export interface SesionEquipo {
  nombre: string;
  correo: string;
  rol: RolEquipo;
  token: string;
}

export function esRolEquipo(valor: string): valor is RolEquipo {
  return valor === 'ADMINISTRADOR' || valor === 'GUIA_TURISTICO';
}

/**
 * Traduce el rol que envía el backend. Mientras el backend conserve
 * PERSONAL_ADMINISTRATIVO y GERENCIA por separado, ambos entran como administrador.
 */
export function rolDesdeServidor(valor: string): RolEquipo | null {
  if (valor === 'PERSONAL_ADMINISTRATIVO' || valor === 'GERENCIA' || valor === 'ADMINISTRADOR') return 'ADMINISTRADOR';
  if (valor === 'GUIA_TURISTICO') return 'GUIA_TURISTICO';
  return null;
}
