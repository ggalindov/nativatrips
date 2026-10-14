import { describe, expect, it } from 'vitest';
import type { Persona, Reserva, SolicitudReserva } from './reserva';
import { acompanantesPendientes, celularValido, extranjerosEn, pasosRecorrido, puedeCancelarse, validarPersona, validarSolicitud } from './reserva';

const solicitud: SolicitudReserva = {
  senderoId: 'lagunas-de-siecha',
  fecha: '2026-10-16',
  personas: 2,
  titular: { nombre: 'Laura Gómez', tipoDocumento: 'CC', documento: '1020304050', nacionalidad: 'CO', correo: 'laura@correo.co', indicativo: '57', celular: '3001234567' },
};

const reserva: Reserva = {
  codigo: 'NT-7Q4K', senderoId: 'lagunas-de-siecha', senderoNombre: 'Lagunas de Siecha', fecha: '2026-10-16',
  horaSalida: '07:00', personas: 3, titular: solicitud.titular, acompanantes: [], estado: 'CONFIRMADA', guia: null, puntoEncuentro: null,
};

describe('reserva', () => {
  it('acepta una solicitud completa', () => {
    expect(validarSolicitud(solicitud)).toEqual([]);
  });

  it('explica cada dato inválido', () => {
    const errores = validarSolicitud({
      ...solicitud,
      fecha: '',
      titular: { ...solicitud.titular, nombre: 'L', documento: '12', correo: 'sin-arroba', celular: '300' },
    });
    expect(errores).toEqual(['fecha', 'nombre', 'documentoNumerico', 'correo', 'celularColombia']);
  });

  it('admite visitantes extranjeros con pasaporte y celular internacional', () => {
    const turista = { ...solicitud.titular, nombre: 'Claire Martin', nacionalidad: 'FR', tipoDocumento: 'PASAPORTE' as const, documento: '19AB12345', indicativo: '33', celular: '612345678' };
    expect(validarSolicitud({ ...solicitud, titular: turista })).toEqual([]);
    const acompanantes: Persona[] = [{ nombre: 'Ana Ruiz', tipoDocumento: 'CC', documento: '52123456', nacionalidad: 'CO' }];
    expect(extranjerosEn({ titular: turista, acompanantes })).toBe(1);
  });

  it('exige un documento acorde a la nacionalidad', () => {
    expect(validarPersona({ nombre: 'John Smith', nacionalidad: 'US', tipoDocumento: 'CC', documento: '1020304050' })).toEqual(['tipoDocumento']);
    expect(validarPersona({ nombre: 'John Smith', nacionalidad: 'US', tipoDocumento: 'PASAPORTE', documento: 'A 12' })).toEqual(['documentoAlfanumerico']);
    expect(validarPersona({ nombre: 'Luisa Pérez', nacionalidad: 'VE', tipoDocumento: 'PPT', documento: '5123456' })).toEqual([]);
  });

  it('valida el celular según el indicativo', () => {
    expect(celularValido('57', '3001234567')).toBe(true);
    expect(celularValido('57', '6011234567')).toBe(false);
    expect(celularValido('1', '2025550143')).toBe(true);
    expect(celularValido('1', '123')).toBe(false);
  });

  it('sitúa cada paso del recorrido según el estado', () => {
    expect(pasosRecorrido('CONFIRMADA').map((p) => p.paso)).toEqual(['hecho', 'hecho', 'actual', 'pendiente']);
    expect(pasosRecorrido('CANCELADA').every((p) => p.paso === 'pendiente')).toBe(true);
  });

  it('cuenta los acompañantes que faltan por registrar', () => {
    expect(acompanantesPendientes(reserva)).toBe(2);
    expect(acompanantesPendientes({ ...reserva, acompanantes: [{ nombre: 'Diego', tipoDocumento: 'CC', documento: '12345', nacionalidad: 'CO' }] })).toBe(1);
  });

  it('solo permite cancelar reservas activas', () => {
    expect(puedeCancelarse(reserva)).toBe(true);
    expect(puedeCancelarse({ ...reserva, estado: 'COMPLETADA' })).toBe(false);
    expect(puedeCancelarse({ ...reserva, estado: 'CANCELADA' })).toBe(false);
  });
});
