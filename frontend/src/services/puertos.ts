import type { Disponibilidad } from '@/domain/aforo';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import type { SesionEquipo } from '@/domain/equipo';
import type { Persona, Reserva, SolicitudReserva } from '@/domain/reserva';
import type { Sendero } from '@/domain/sendero';

/**
 * Puertos que la interfaz usa para hablar con el sistema. Cada uno tiene un
 * adaptador en memoria (desarrollo y pruebas) y uno HTTP (API del backend).
 */
export interface SenderosServicio {
  listar(): Promise<Sendero[]>;
  obtener(id: string): Promise<Sendero>;
  disponibilidad(id: string, desde: string, dias: number): Promise<Disponibilidad[]>;
}

export interface ReservaCreada {
  codigo: string;
  /** Solo en desarrollo: el enlace que en producción llega por correo. */
  enlaceDesarrollo?: string;
}

export interface ReservasServicio {
  crear(solicitud: SolicitudReserva): Promise<ReservaCreada>;
  /** Intercambia el enlace mágico por la reserva que gestiona. */
  abrirConEnlace(token: string): Promise<Reserva>;
  solicitarEnlace(codigo: string, correo: string): Promise<void>;
  agregarAcompanante(token: string, persona: Persona): Promise<Reserva>;
  cancelar(token: string): Promise<Reserva>;
}

export interface ReservaEnRevision {
  codigo: string;
  titular: string;
  motivo: string;
  senderoNombre: string;
  fecha: string;
}

export interface Salida {
  hora: string;
  senderoNombre: string;
  personas: number;
  guia: string | null;
}

export interface Visitante {
  id: string;
  nombre: string;
  nota: string;
  presente: boolean;
}

export interface SalidaGuia {
  senderoNombre: string;
  hora: string;
  total: number;
  visitantes: Visitante[];
}

export interface OcupacionSendero {
  senderoNombre: string;
  ocupados: number;
  limite: number;
}

export interface ResumenGerencia {
  ocupacionPromedioPct: number;
  visitantes: number;
  reservas: number;
  cancelacionesPct: number;
  ocupacionDiariaPct: number[];
  ranking: { senderoNombre: string; visitantes: number; ocupacionPct: number }[];
}

export interface OperacionServicio {
  enRevision(): Promise<ReservaEnRevision[]>;
  resolverRevision(codigo: string, aprobar: boolean): Promise<void>;
  salidasDelDia(fecha: string): Promise<Salida[]>;
  ocupacion(fecha: string): Promise<OcupacionSendero[]>;
  salidaDelGuia(fecha: string): Promise<SalidaGuia | null>;
  marcarAsistencia(visitanteId: string, presente: boolean): Promise<void>;
  resumenGerencia(mes: string): Promise<ResumenGerencia>;
}

export interface BibliotecaServicio {
  listar(): Promise<ElementoBiblioteca[]>;
}

export interface AutenticacionServicio {
  iniciarSesion(correo: string, clave: string): Promise<SesionEquipo>;
}

export interface Servicios {
  senderos: SenderosServicio;
  reservas: ReservasServicio;
  operacion: OperacionServicio;
  autenticacion: AutenticacionServicio;
  biblioteca: BibliotecaServicio;
}

/** Errores de negocio conocidos; la interfaz los traduce al idioma activo. */
export type CodigoError =
  | 'senderoInexistente'
  | 'enlaceInvalido'
  | 'sinCupos'
  | 'acompanantesCompletos'
  | 'acompananteInvalido'
  | 'revisionInexistente'
  | 'credenciales'
  | 'sinConexion'
  | 'noDisponible'
  | 'cuentaNoEquipo'
  | 'asistenteNoDisponible'
  | 'datosInvalidos'
  | 'servidor';

/**
 * Error esperable de negocio. `codigo` permite mostrarlo en el idioma de la
 * persona; `message` queda en español para registros y para errores del
 * servidor que no tienen código.
 */
export class ErrorServicio extends Error {
  readonly codigo: CodigoError | null;

  constructor(message: string, codigo: CodigoError | null = null) {
    super(message);
    this.name = 'ErrorServicio';
    this.codigo = codigo;
  }
}
