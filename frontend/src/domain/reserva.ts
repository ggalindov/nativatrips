import { COLOMBIA, esExtranjero } from './paises';

/** Estados de la reserva, alineados con EstadoReserva del backend. */
export type EstadoReserva =
  | 'PENDIENTE_PAGO'
  | 'EN_REVISION'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'EXPIRADA'
  | 'COMPLETADA';

/** Recorrido normal de una reserva, en orden. */
export const RECORRIDO: readonly EstadoReserva[] = ['PENDIENTE_PAGO', 'EN_REVISION', 'CONFIRMADA', 'COMPLETADA'];

/**
 * Documentos con los que se puede ingresar al parque. Cédula y tarjeta de
 * identidad para colombianos; cédula de extranjería y PPT para extranjeros
 * residentes; pasaporte o documento nacional de identidad para visitantes.
 */
export type TipoDocumento = 'CC' | 'TI' | 'CE' | 'PPT' | 'PASAPORTE' | 'DNI';

export const DOCUMENTOS_NACIONALES: readonly TipoDocumento[] = ['CC', 'TI'];
export const DOCUMENTOS_EXTRANJEROS: readonly TipoDocumento[] = ['PASAPORTE', 'CE', 'PPT', 'DNI'];

/** Documentos que admite una persona según su nacionalidad. */
export function documentosPara(nacionalidad: string): readonly TipoDocumento[] {
  return esExtranjero(nacionalidad) ? DOCUMENTOS_EXTRANJEROS : DOCUMENTOS_NACIONALES;
}

/** Pasaporte y DNI pueden tener letras; los demás son solo números. */
export function documentoAlfanumerico(tipo: TipoDocumento): boolean {
  return tipo === 'PASAPORTE' || tipo === 'DNI';
}

export function documentoValido(tipo: TipoDocumento, numero: string): boolean {
  const n = numero.trim();
  return documentoAlfanumerico(tipo) ? /^[A-Za-z0-9]{5,20}$/.test(n) : /^\d{5,12}$/.test(n);
}

export interface Persona {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  /** Nacionalidad, código ISO 3166-1 alfa-2 ("CO" para Colombia). */
  nacionalidad: string;
}

export interface Titular extends Persona {
  correo: string;
  /** Indicativo internacional sin "+": 57 para Colombia. */
  indicativo: string;
  celular: string;
}

export const PERSONA_VACIA: Persona = { nombre: '', tipoDocumento: 'CC', documento: '', nacionalidad: COLOMBIA };

export interface Reserva {
  codigo: string;
  senderoId: string;
  senderoNombre: string;
  fecha: string;
  horaSalida: string;
  personas: number;
  titular: Titular;
  acompanantes: Persona[];
  estado: EstadoReserva;
  guia: string | null;
  puntoEncuentro: string | null;
  tipoGrupo: TipoGrupo;
  requerimientos: string | null;
  /** Última solicitud de cambio de fecha, si la hay. */
  reprogramacion: Reprogramacion | null;
}

/** Tipo de grupo (RF-09): los corporativos y con necesidades especiales pasan por revisión del equipo antes del pago. */
export type TipoGrupo = 'ESTANDAR' | 'GRUPO_CORPORATIVO' | 'NECESIDAD_ESPECIAL';

export const TIPOS_GRUPO: readonly TipoGrupo[] = ['ESTANDAR', 'GRUPO_CORPORATIVO', 'NECESIDAD_ESPECIAL'];

export function requiereRevision(tipo: TipoGrupo): boolean {
  return tipo !== 'ESTANDAR';
}

/** Causales de reprogramación del Anexo 16: las únicas que permiten cambiar la fecha de una reserva pagada. */
export type CausalReprogramacion = 'INCAPACIDAD_MEDICA' | 'FALLECIMIENTO_FAMILIAR' | 'FUERZA_MAYOR';

export const CAUSALES: readonly CausalReprogramacion[] = ['INCAPACIDAD_MEDICA', 'FALLECIMIENTO_FAMILIAR', 'FUERZA_MAYOR'];

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Reprogramacion {
  causal: CausalReprogramacion;
  fechaDeseada: string;
  estado: EstadoSolicitud;
  motivo: string | null;
}

export interface SolicitudReprogramacion {
  causal: CausalReprogramacion;
  descripcion: string;
  fechaDeseada: string;
  soporte: File;
}

/** Soporte del Anexo 16: PDF, JPG o PNG de hasta 5 MB (el servidor revisa el tipo real del archivo). */
export const SOPORTE_MAXIMO_BYTES = 5 * 1024 * 1024;
export const SOPORTE_TIPOS = 'application/pdf,image/jpeg,image/png';

export interface SolicitudReserva {
  senderoId: string;
  fecha: string;
  personas: number;
  titular: Titular;
  tipoGrupo: TipoGrupo;
  /** Lo que el guía debe saber del grupo: obligatorio para necesidades especiales. */
  requerimientos: string;
}

/** Una reserva en el historial de un correo (RF-36). */
export interface ReservaDelHistorial {
  codigo: string;
  senderoId: string;
  senderoNombre: string;
  fecha: string;
  personas: number;
  estado: EstadoReserva;
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

/** Mientras la reserva sigue en pie se pueden registrar acompañantes. */
export function admiteCambios(r: Reserva): boolean {
  return r.estado === 'PENDIENTE_PAGO' || r.estado === 'EN_REVISION' || r.estado === 'CONFIRMADA';
}

/**
 * RF-37 (Anexo 16): una reserva pagada no se cancela con devolución; solo se pide otra fecha, hasta el
 * día del tour y sin otra solicitud esperando decisión.
 */
export function puedeReprogramarse(r: Reserva, hoy: string): boolean {
  return r.estado === 'CONFIRMADA' && r.fecha >= hoy && r.reprogramacion?.estado !== 'PENDIENTE';
}

/** Personas extranjeras en la reserva (titular y acompañantes registrados). */
export function extranjerosEn(r: { titular: Pick<Persona, 'nacionalidad'>; acompanantes: readonly Pick<Persona, 'nacionalidad'>[] }): number {
  return [r.titular, ...r.acompanantes].filter((p) => esExtranjero(p.nacionalidad)).length;
}

/** Motivo de cada dato inválido; la interfaz lo traduce al idioma del visitante. */
export type ErrorValidacion =
  | 'fecha'
  | 'personas'
  | 'nombre'
  | 'nacionalidad'
  | 'tipoDocumento'
  | 'documentoNumerico'
  | 'documentoAlfanumerico'
  | 'correo'
  | 'celularColombia'
  | 'celularInternacional'
  | 'requerimientos';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarPersona(p: Persona): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (p.nombre.trim().length < 3) errores.push('nombre');
  if (!/^[A-Z]{2}$/.test(p.nacionalidad)) errores.push('nacionalidad');
  if (!documentosPara(p.nacionalidad).includes(p.tipoDocumento)) errores.push('tipoDocumento');
  else if (!documentoValido(p.tipoDocumento, p.documento)) errores.push(documentoAlfanumerico(p.tipoDocumento) ? 'documentoAlfanumerico' : 'documentoNumerico');
  return errores;
}

/** Celular colombiano: 10 dígitos que empiezan por 3. Internacional: de 6 a 14 dígitos. */
export function celularValido(indicativo: string, celular: string): boolean {
  const n = celular.replace(/[\s-]/g, '');
  return indicativo === '57' ? /^3\d{9}$/.test(n) : /^\d{6,14}$/.test(n);
}

export function validarSolicitud(s: SolicitudReserva): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (!s.fecha) errores.push('fecha');
  if (s.personas < 1) errores.push('personas');
  errores.push(...validarPersona(s.titular));
  if (!CORREO.test(s.titular.correo.trim())) errores.push('correo');
  if (!celularValido(s.titular.indicativo, s.titular.celular)) errores.push(s.titular.indicativo === '57' ? 'celularColombia' : 'celularInternacional');
  if (s.tipoGrupo === 'NECESIDAD_ESPECIAL' && s.requerimientos.trim().length < 5) errores.push('requerimientos');
  return errores;
}
