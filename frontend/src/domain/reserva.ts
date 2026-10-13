/** Estados de la reserva, alineados con EstadoReserva del backend. */
export type EstadoReserva =
  | 'PENDIENTE_PAGO'
  | 'EN_REVISION'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'COMPLETADA';

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  EN_REVISION: 'En revisión',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada',
  COMPLETADA: 'Realizada',
};

/** Recorrido normal de una reserva, en orden. */
export const RECORRIDO: readonly EstadoReserva[] = ['PENDIENTE_PAGO', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];

export interface Persona {
  nombre: string;
  documento: string;
}

export interface Reserva {
  codigo: string;
  senderoId: string;
  senderoNombre: string;
  fecha: string;
  horaSalida: string;
  personas: number;
  titular: Persona & { correo: string; celular: string };
  acompanantes: Persona[];
  estado: EstadoReserva;
  guia: string | null;
}

export interface SolicitudReserva {
  senderoId: string;
  fecha: string;
  personas: number;
  titular: Persona & { correo: string; celular: string };
}

export type PasoRecorrido = 'hecho' | 'actual' | 'pendiente';

/** Situación de cada paso del recorrido según el estado actual. */
export function pasosRecorrido(estado: EstadoReserva): { estado: EstadoReserva; paso: PasoRecorrido }[] {
  const actual = RECORRIDO.indexOf(estado);
  return RECORRIDO.map((e, i) => ({
    estado: e,
    paso: actual === -1 ? 'pendiente' : i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente',
  }));
}

export function acompanantesPendientes(r: Reserva): number {
  return Math.max(0, r.personas - 1 - r.acompanantes.length);
}

export function puedeCancelarse(r: Reserva): boolean {
  return r.estado === 'PENDIENTE_PAGO' || r.estado === 'EN_REVISION' || r.estado === 'CONFIRMADA';
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarSolicitud(s: SolicitudReserva): string[] {
  const errores: string[] = [];
  if (!s.fecha) errores.push('Elige una fecha.');
  if (s.personas < 1) errores.push('La reserva debe tener al menos una persona.');
  if (s.titular.nombre.trim().length < 3) errores.push('Escribe el nombre completo de quien reserva.');
  if (!/^\d{5,12}$/.test(s.titular.documento.trim())) errores.push('El documento debe tener entre 5 y 12 dígitos.');
  if (!CORREO.test(s.titular.correo.trim())) errores.push('Escribe un correo válido: ahí llega el enlace de la reserva.');
  if (!/^\d{10}$/.test(s.titular.celular.replace(/\s/g, ''))) errores.push('El celular debe tener 10 dígitos.');
  return errores;
}
