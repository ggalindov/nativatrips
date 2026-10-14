import { describe, expect, it } from 'vitest';
import { cuposLibres } from '@/domain/aforo';
import { ErrorServicio } from '../puertos';
import { CLAVE_DEMO } from './datos';
import { crearServiciosEnMemoria } from './serviciosEnMemoria';

const titular = { nombre: 'Laura Gómez', tipoDocumento: 'CC' as const, documento: '1020304050', nacionalidad: 'CO', indicativo: '57', correo: 'laura@correo.co', celular: '3001234567' };

async function fechaConCupos(s: ReturnType<typeof crearServiciosEnMemoria>, minimo: number) {
  const dias = await s.senderos.disponibilidad('lagunas-de-siecha', '2026-10-12', 30);
  const d = dias.find((x) => cuposLibres(x) >= minimo);
  if (!d) throw new Error('Sin fechas con cupos en los datos de prueba');
  return d;
}

describe('servicios en memoria', () => {
  it('lista los 13 senderos del catálogo', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    expect(await s.senderos.listar()).toHaveLength(13);
  });

  it('crea una reserva, descuenta los cupos y la abre con el enlace', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    const d = await fechaConCupos(s, 2);
    const creada = await s.reservas.crear({ senderoId: 'lagunas-de-siecha', fecha: d.fecha, personas: 2, titular });

    expect(creada.codigo).toMatch(/^NT-[A-Z2-9]{4}$/);
    const [despues] = await s.senderos.disponibilidad('lagunas-de-siecha', d.fecha, 1);
    expect(cuposLibres(despues)).toBe(cuposLibres(d) - 2);

    const token = creada.enlaceDesarrollo!.split('/').pop()!;
    const reserva = await s.reservas.abrirConEnlace(token);
    expect(reserva.estado).toBe('PENDIENTE_PAGO');
    expect(reserva.titular.correo).toBe('laura@correo.co');
  });

  it('rechaza una reserva que supera los cupos libres', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    const d = await fechaConCupos(s, 1);
    await expect(
      s.reservas.crear({ senderoId: 'lagunas-de-siecha', fecha: d.fecha, personas: cuposLibres(d) + 1, titular }),
    ).rejects.toThrow('Ya no quedan cupos suficientes');
  });

  it('no deja registrar más acompañantes de los reservados', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    const d = await fechaConCupos(s, 2);
    const { enlaceDesarrollo } = await s.reservas.crear({ senderoId: 'lagunas-de-siecha', fecha: d.fecha, personas: 2, titular });
    const token = enlaceDesarrollo!.split('/').pop()!;

    await s.reservas.agregarAcompanante(token, { nombre: 'Diego Gómez', tipoDocumento: 'CC', documento: '98765432', nacionalidad: 'CO' });
    await expect(s.reservas.agregarAcompanante(token, { nombre: 'Otra Persona', tipoDocumento: 'PASAPORTE', documento: 'X1122334', nacionalidad: 'FR' })).rejects.toBeInstanceOf(
      ErrorServicio,
    );
  });

  it('libera los cupos al cancelar', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    const d = await fechaConCupos(s, 3);
    const { enlaceDesarrollo } = await s.reservas.crear({ senderoId: 'lagunas-de-siecha', fecha: d.fecha, personas: 3, titular });
    const cancelada = await s.reservas.cancelar(enlaceDesarrollo!.split('/').pop()!);

    expect(cancelada.estado).toBe('CANCELADA');
    const [despues] = await s.senderos.disponibilidad('lagunas-de-siecha', d.fecha, 1);
    expect(cuposLibres(despues)).toBe(cuposLibres(d));
  });

  it('rechaza un enlace desconocido', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    await expect(s.reservas.abrirConEnlace('no-existe')).rejects.toThrow('El enlace no es válido');
  });

  it('inicia sesión del equipo con el rol de la cuenta', async () => {
    const s = crearServiciosEnMemoria({ latenciaMs: 0 });
    const sesion = await s.autenticacion.iniciarSesion('GUIA@ecopalacio.co ', CLAVE_DEMO);
    expect(sesion.rol).toBe('GUIA_TURISTICO');
    await expect(s.autenticacion.iniciarSesion('guia@ecopalacio.co', 'otra')).rejects.toThrow('incorrectos');
  });
});
