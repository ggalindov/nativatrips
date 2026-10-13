import { describe, expect, it } from 'vitest';
import type { Reserva, SolicitudReserva } from './reserva';
import { acompanantesPendientes, pasosRecorrido, puedeCancelarse, validarSolicitud } from './reserva';

const solicitud: SolicitudReserva = {
  senderoId: 'lagunas-de-siecha',
  fecha: '2026-10-16',
  personas: 2,
  titular: { nombre: 'Laura Gómez', documento: '1020304050', correo: 'laura@correo.co', celular: '3001234567' },
};

const reserva: Reserva = {
  codigo: 'NT-7Q4K', senderoId: 'lagunas-de-siecha', senderoNombre: 'Lagunas de Siecha', fecha: '2026-10-16',
  horaSalida: '07:00', personas: 3, titular: solicitud.titular, acompanantes: [], estado: 'CONFIRMADA', guia: null,
};

describe('reserva', () => {
  it('acepta una solicitud completa', () => {
    expect(validarSolicitud(solicitud)).toEqual([]);
  });

  it('explica cada dato inválido', () => {
    const errores = validarSolicitud({
      ...solicitud,
      fecha: '',
      titular: { nombre: 'L', documento: '12', correo: 'sin-arroba', celular: '300' },
    });
    expect(errores).toHaveLength(5);
    expect(errores[0]).toBe('Elige una fecha.');
  });

  it('sitúa cada paso del recorrido según el estado', () => {
    expect(pasosRecorrido('CONFIRMADA').map((p) => p.paso)).toEqual(['hecho', 'hecho', 'actual', 'pendiente']);
    expect(pasosRecorrido('CANCELADA').every((p) => p.paso === 'pendiente')).toBe(true);
  });

  it('cuenta los acompañantes que faltan por registrar', () => {
    expect(acompanantesPendientes(reserva)).toBe(2);
    expect(acompanantesPendientes({ ...reserva, acompanantes: [{ nombre: 'Diego', documento: '12345' }] })).toBe(1);
  });

  it('solo permite cancelar reservas activas', () => {
    expect(puedeCancelarse(reserva)).toBe(true);
    expect(puedeCancelarse({ ...reserva, estado: 'COMPLETADA' })).toBe(false);
    expect(puedeCancelarse({ ...reserva, estado: 'CANCELADA' })).toBe(false);
  });
});
