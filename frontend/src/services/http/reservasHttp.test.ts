import { describe, expect, it, vi } from 'vitest';
import { ErrorServicio } from '../puertos';
import { leerEventos } from './clienteHttp';
import { crearServiciosHttp } from './serviciosHttp';

function respuesta(estado: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serviciosCon(fetchFalso: typeof fetch) {
  return crearServiciosHttp({ baseUrl: '', idioma: () => 'es', token: () => null, fetch: fetchFalso });
}

const TITULAR = { nombre: 'Laura Gómez', tipoDocumento: 'CC' as const, documento: '1020304050', nacionalidad: 'CO', correo: 'laura@correo.co', indicativo: '57', celular: '3001234567' };

describe('reservas y catálogo contra la API', () => {
  it('reserva sin cuenta con el tipo de grupo y los requerimientos', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(201, { codigoReserva: 'NT-7Q4KX2', estado: 'EN_REVISION' }));

    const creada = await serviciosCon(fetchFalso).reservas.crear({
      senderoId: '7', fecha: '2026-10-24', personas: 3, titular: TITULAR, tipoGrupo: 'NECESIDAD_ESPECIAL', requerimientos: ' Silla de ruedas ',
    });

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('/api/v1/reservas/sin-cuenta');
    expect(JSON.parse(init?.body as string)).toMatchObject({
      senderoId: 7, fechaTour: '2026-10-24', personas: 3, tipoGrupo: 'NECESIDAD_ESPECIAL', requerimientosEspeciales: 'Silla de ruedas',
    });
    expect(creada).toEqual({ codigo: 'NT-7Q4KX2', estado: 'EN_REVISION' });
  });

  it('los días sin capacidad publicada llegan cerrados y los demás con sus cupos reales (RF-01)', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, [
      { fecha: '2026-10-22', publicada: true, reservable: true, cupoMaximo: 30, ocupacion: 12 },
      { fecha: '2026-10-23', publicada: true, reservable: false, cupoMaximo: 30, ocupacion: 30 },
      { fecha: '2026-10-24', publicada: false, reservable: false, cupoMaximo: 0, ocupacion: 0 },
    ]));

    const dias = await serviciosCon(fetchFalso).senderos.disponibilidad('7', '2026-10-22', 30);

    expect(fetchFalso.mock.calls[0][0]).toBe('/api/v1/senderos/7/calendario?desde=2026-10-22&dias=21');
    expect(dias).toEqual([
      { fecha: '2026-10-22', limite: 30, ocupados: 12 },
      { fecha: '2026-10-23', limite: 30, ocupados: 30 },
      { fecha: '2026-10-24', limite: 0, ocupados: 0, cerrada: true },
    ]);
  });

  it('trae los requisitos de ingreso y la clave del sendero para sus fotos (RF-02)', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, [{
      id: 3, nombre: 'Los Cáquezas', nivelDificultad: 'MODERADO', duracionMinutos: 270, descripcion: 'Cascadas', requisitosIngreso: 'Botas',
      precio: 180000, activo: true, publicado: true, distanciaKm: 9.2, desnivelM: 490, altitudMaxM: 3520, sector: 'San Juanito',
      horaSalida: '07:00:00', puntoEncuentro: 'Casas', destacados: [], fotos: ['/api/v1/senderos/3/fotos/abc'],
    }]));

    const [sendero] = await serviciosCon(fetchFalso).senderos.listar();

    expect(sendero).toMatchObject({ id: '3', clave: 'los-caquezas', requisitosIngreso: 'Botas', horaSalida: '07:00', duracionHoras: 4.5 });
    expect(sendero.fotos).toEqual(['/api/v1/senderos/3/fotos/abc']);
  });

  it('la baja con reservas futuras devuelve cuántas son para pedir confirmación (RF-35)', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(
      respuesta(409, { message: 'El sendero tiene 4 reserva(s)', codigo: 'RESERVAS_FUTURAS', detalles: { reservasFuturas: 4 } }),
    );

    const error = await serviciosCon(fetchFalso).catalogo.darDeBaja('3', false).catch((e: unknown) => e);

    expect(fetchFalso.mock.calls[0][0]).toBe('/api/v1/senderos/3?confirmar=false');
    expect(error).toBeInstanceOf(ErrorServicio);
    expect((error as ErrorServicio).codigo).toBe('reservasFuturas');
    expect((error as ErrorServicio).detalles).toEqual({ reservasFuturas: 4 });
  });

  it('la reprogramación viaja como formulario con el soporte y el token en la cabecera (RF-37)', async () => {
    const fetchFalso = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(respuesta(201, { id: 'p1' }))
      .mockResolvedValueOnce(respuesta(200, {
        codigo: 'NT-7Q4KX2', senderoId: 3, senderoNombre: 'Los Cáquezas', fecha: '2026-10-24', horaSalida: '07:00:00', personas: 2,
        titular: TITULAR, acompanantes: [], estado: 'EN_REVISION', guia: null, puntoEncuentro: null, tipoGrupo: 'ESTANDAR',
        requerimientosEspeciales: null, reprogramacion: { causal: 'INCAPACIDAD_MEDICA', fechaDeseada: '2026-11-02', estado: 'PENDIENTE', motivoDecision: null },
      }));
    const soporte = new File(['%PDF-1.4'], 'incapacidad.pdf', { type: 'application/pdf' });

    const reserva = await serviciosCon(fetchFalso).reservas.solicitarReprogramacion('token-enlace', {
      causal: 'INCAPACIDAD_MEDICA', descripcion: 'Gripa', fechaDeseada: '2026-11-02', soporte,
    });

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('/api/v1/mi-reserva/reprogramacion');
    expect(new Headers(init?.headers).get('X-Enlace-Reserva')).toBe('token-enlace');
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
    const datos = init?.body as FormData;
    expect(datos.get('causal')).toBe('INCAPACIDAD_MEDICA');
    expect(datos.get('soporte')).toBeInstanceOf(File);
    expect(reserva.reprogramacion).toEqual({ causal: 'INCAPACIDAD_MEDICA', fechaDeseada: '2026-11-02', estado: 'PENDIENTE', motivo: null });
  });

  it('un soporte de tipo no permitido se explica en el idioma de la persona', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(415, { message: 'tipo', codigo: 'TIPO_NO_PERMITIDO' }));

    const error = await serviciosCon(fetchFalso).catalogo.subirFoto('3', new File(['x'], 'a.png')).catch((e: unknown) => e);

    expect((error as ErrorServicio).codigo).toBe('archivoNoPermitido');
  });

  it('el historial por correo usa su propia cabecera (RF-36)', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, [
      { codigo: 'NT-7Q4KX2', senderoId: 3, senderoNombre: 'Los Cáquezas', fecha: '2026-10-24', personas: 2, estado: 'CONFIRMADA' },
    ]));

    const historial = await serviciosCon(fetchFalso).reservas.historial('token-historial');

    expect(new Headers(fetchFalso.mock.calls[0][1]?.headers).get('X-Enlace-Historial')).toBe('token-historial');
    expect(historial[0].senderoId).toBe('3');
  });
});

describe('eventos en vivo del panel', () => {
  it('lee cada evento con su nombre y sus datos aunque lleguen partidos', async () => {
    const trozos = ['event:reserva\ndata:{"codigo":', '"NT-1"}\n\n:latido\n\nevent:aforo\r\ndata:{"porcentaje":85}\r\n\r\n'];
    const cuerpo = new ReadableStream<Uint8Array>({
      start(c) {
        trozos.forEach((t) => c.enqueue(new TextEncoder().encode(t)));
        c.close();
      },
    });
    const recibidos: [string, string][] = [];

    await leerEventos(cuerpo, (nombre, datos) => recibidos.push([nombre, datos]));

    expect(recibidos).toEqual([
      ['reserva', '{"codigo":"NT-1"}'],
      ['aforo', '{"porcentaje":85}'],
    ]);
  });
});
