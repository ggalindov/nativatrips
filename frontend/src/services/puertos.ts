import type { Disponibilidad } from '@/domain/aforo';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import type { SesionEquipo } from '@/domain/equipo';
import type {
  CausalReprogramacion,
  EstadoReserva,
  EstadoSolicitud,
  Persona,
  Reserva,
  ReservaDelHistorial,
  SolicitudReprogramacion,
  SolicitudReserva,
  TipoGrupo,
} from '@/domain/reserva';
import type { Dificultad, Sendero } from '@/domain/sendero';

/**
 * Puertos que la interfaz usa para hablar con el sistema. Cada uno tiene un
 * adaptador en memoria (desarrollo y pruebas) y uno HTTP (API del backend).
 */
export interface SenderosServicio {
  listar(): Promise<Sendero[]>;
  obtener(id: string): Promise<Sendero>;
  /** RF-01: cupos reales de cada día; los días sin capacidad publicada llegan con límite 0. */
  disponibilidad(id: string, desde: string, dias: number): Promise<Disponibilidad[]>;
}

/** Sendero tal como lo ve el editor del administrador (RF-35). */
export interface SenderoAdmin extends Sendero {
  activo: boolean;
  publicado: boolean;
}

/** Datos que el administrador escribe; la API los valida igual. */
export interface DatosSendero {
  nombre: string;
  descripcion: string;
  dificultad: Dificultad;
  duracionHoras: number;
  precioPorPersona: number | null;
  requisitosIngreso: string;
  distanciaKm: number | null;
  desnivelM: number | null;
  altitudMaxM: number | null;
  sector: string;
  horaSalida: string;
  puntoEncuentro: string;
  destacados: string[];
}

export interface CatalogoServicio {
  listar(): Promise<SenderoAdmin[]>;
  /** Sin id crea el sendero en borrador. */
  guardar(datos: DatosSendero, id?: string): Promise<SenderoAdmin>;
  publicar(id: string, publicado: boolean): Promise<SenderoAdmin>;
  /**
   * Da de baja el sendero. Sin confirmar y con reservas desde hoy falla con el código
   * `reservasFuturas` y su cantidad, para que el administrador decida.
   */
  darDeBaja(id: string, confirmar: boolean): Promise<void>;
  subirFoto(id: string, archivo: File): Promise<SenderoAdmin>;
  borrarFoto(id: string, url: string): Promise<SenderoAdmin>;
}

export interface ReservaCreada {
  codigo: string;
  /** EN_REVISION para grupos que aprueba el equipo; PENDIENTE_PAGO para el resto. */
  estado: EstadoReserva;
  /** Solo en desarrollo: el enlace que en producción llega por correo. */
  enlaceDesarrollo?: string;
}

export interface ReservasServicio {
  crear(solicitud: SolicitudReserva): Promise<ReservaCreada>;
  /** Intercambia el enlace mágico por la reserva que gestiona. */
  abrirConEnlace(token: string): Promise<Reserva>;
  solicitarEnlace(codigo: string, correo: string): Promise<void>;
  agregarAcompanante(token: string, persona: Persona): Promise<Reserva>;
  /** RF-37: pide otra fecha con causal y soporte; la reserva queda en revisión. */
  solicitarReprogramacion(token: string, solicitud: SolicitudReprogramacion): Promise<Reserva>;
  /** RF-36: envía al correo un enlace con todas sus reservas. Responde igual exista o no. */
  solicitarHistorial(correo: string): Promise<void>;
  historial(token: string): Promise<ReservaDelHistorial[]>;
  /** Prepara el pago en Wompi y devuelve la dirección del checkout, a la que se lleva al navegador. */
  iniciarPago(token: string): Promise<string>;
}

export interface ReservaEnRevision {
  id: string;
  codigo: string;
  titular: string;
  motivo: string;
  senderoNombre: string;
  fecha: string;
  personas: number;
  tipoGrupo: TipoGrupo;
}

export interface ReprogramacionEnRevision {
  id: string;
  codigo: string;
  titular: string;
  personas: number;
  causal: CausalReprogramacion;
  descripcion: string;
  fechaOriginal: string;
  fechaDeseada: string;
  estado: EstadoSolicitud;
}

export interface Salida {
  hora: string;
  senderoNombre: string;
  personas: number;
  guia: string | null;
}

export interface Visitante {
  id: string;
  /** Reserva a la que pertenece: la asistencia se marca persona por persona dentro de su reserva. */
  reservaId: string;
  nombre: string;
  nota: string;
  /** Código ISO del país, para la bandera. */
  pais: string;
  /** RF-11: salidas anteriores completadas con el mismo documento. */
  visitasPrevias: number;
  presente: boolean;
}

export interface SalidaGuia {
  senderoNombre: string;
  hora: string;
  total: number;
  /** Reservas que forman la salida; al cerrar el tour se cierran todas. */
  reservaIds: string[];
  /** RF-11: requerimientos especiales que declararon los grupos. */
  requerimientos: { codigo: string; texto: string }[];
  visitantes: Visitante[];
  /** Personas reservadas que aún no registran sus datos. */
  sinRegistrar: number;
  cerrada: boolean;
}

/** RF-38: un tour asignado al guía. */
export interface TourAgenda {
  fecha: string;
  hora: string;
  senderoNombre: string;
  personas: number;
  puntoEncuentro: string | null;
}

export interface OcupacionSendero {
  senderoNombre: string;
  ocupados: number;
  limite: number;
  /** Porcentaje desde el que se alerta (RF-26). */
  umbralPct: number;
}

export interface ResumenGerencia {
  ocupacionPromedioPct: number;
  visitantes: number;
  reservas: number;
  cancelacionesPct: number;
  ocupacionDiariaPct: number[];
  ranking: { senderoNombre: string; visitantes: number; ocupacionPct: number }[];
}

/** Una reserva tal como la ve el administrador en su panel. */
export interface ReservaDelPanel {
  id: string;
  codigo: string;
  senderoId: string;
  senderoNombre: string;
  fecha: string;
  hora: string;
  personas: number;
  tipoGrupo: TipoGrupo;
  estado: EstadoReserva;
  guiaId: string | null;
  guiaNombre: string | null;
  titular: (Persona & { correo: string; celular: string }) | null;
  /** Personas ya registradas, titular incluido. */
  integrantes: Persona[];
  requerimientos: string | null;
  /** Instante ISO en que se creó. */
  creada: string;
}

export interface GuiaEquipo {
  id: string;
  nombre: string;
  correo: string;
}

/** RF-23 a RF-26: capacidad publicada de un sendero en un día, con su ocupación. */
export interface CapacidadDia {
  senderoId: string;
  fecha: string;
  cupoMaximo: number;
  umbralPct: number;
  ocupacion: number;
}

/** RF-08 y RF-26: lo que llega en vivo al panel. */
export type EventoPanel =
  | {
      tipo: 'reserva';
      codigo: string;
      estado: EstadoReserva;
      senderoNombre: string;
      fecha: string;
      personas: number;
      tipoGrupo: TipoGrupo;
      titular: string | null;
    }
  | { tipo: 'aforo'; senderoNombre: string; fecha: string; ocupacion: number; cupoMaximo: number; porcentaje: number; umbral: number };

export interface OperacionServicio {
  enRevision(): Promise<ReservaEnRevision[]>;
  resolverRevision(id: string, aprobar: boolean, motivo?: string): Promise<void>;
  reprogramaciones(): Promise<ReprogramacionEnRevision[]>;
  /** Soporte adjunto de una solicitud; solo lo ve el administrador. */
  soporteReprogramacion(id: string): Promise<Blob>;
  decidirReprogramacion(id: string, aprobar: boolean, motivo?: string): Promise<void>;
  salidasDelDia(fecha: string): Promise<Salida[]>;
  /** Reservas con fecha de tour en el rango (máximo 62 días), de todos los estados. */
  reservasDelPeriodo(desde: string, hasta: string): Promise<ReservaDelPanel[]>;
  guias(): Promise<GuiaEquipo[]>;
  /** Solo para reservas confirmadas. */
  asignarGuia(reservaId: string, guiaId: string): Promise<void>;
  capacidad(desde: string, hasta: string): Promise<CapacidadDia[]>;
  /** RF-23: carga o corrige la capacidad de varios días de un sendero. */
  cargarCapacidad(senderoId: string, dias: Omit<CapacidadDia, 'senderoId' | 'ocupacion'>[]): Promise<void>;
  ocupacion(fecha: string): Promise<OcupacionSendero[]>;
  salidaDelGuia(fecha: string): Promise<SalidaGuia | null>;
  marcarAsistencia(visitante: Pick<Visitante, 'id' | 'reservaId'>, presente: boolean): Promise<void>;
  /** Cierra el tour: las reservas de la salida quedan completadas con su asistencia. */
  cerrarSalida(reservaIds: string[]): Promise<void>;
  agendaGuia(desde: string, dias: number): Promise<TourAgenda[]>;
  /** Suscribe el panel a los eventos en vivo; devuelve la función para cancelar la suscripción. */
  escucharEventos(alEvento: (e: EventoPanel) => void): () => void;
  resumenGerencia(mes: string): Promise<ResumenGerencia>;
}

export interface BibliotecaServicio {
  listar(): Promise<ElementoBiblioteca[]>;
}

export interface AutenticacionServicio {
  iniciarSesion(correo: string, clave: string): Promise<SesionEquipo>;
  /** Invalida el token en el servidor; después la interfaz olvida la sesión. */
  cerrarSesion(): Promise<void>;
  /** Pide el enlace de recuperación. Responde igual exista o no el correo. */
  solicitarRecuperacion(correo: string): Promise<void>;
  /** Crea la contraseña nueva con el token del enlace (vence en 30 minutos y sirve una vez). */
  restablecerClave(token: string, nueva: string): Promise<void>;
}

export interface Servicios {
  senderos: SenderosServicio;
  catalogo: CatalogoServicio;
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
  | 'servidor'
  | 'sesionVencida'
  | 'enlaceRecuperacionVencido'
  | 'archivoNoPermitido'
  | 'reservasFuturas'
  | 'pagosNoConfigurados';

/**
 * Error esperable de negocio. `codigo` permite mostrarlo en el idioma de la
 * persona; `message` queda en español para registros y para errores del
 * servidor que no tienen código. `detalles` trae los datos que acompañan al
 * error (por ejemplo, cuántas reservas futuras tiene un sendero).
 */
export class ErrorServicio extends Error {
  readonly codigo: CodigoError | null;
  readonly detalles: Record<string, unknown>;

  constructor(message: string, codigo: CodigoError | null = null, detalles: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ErrorServicio';
    this.codigo = codigo;
    this.detalles = detalles;
  }
}
