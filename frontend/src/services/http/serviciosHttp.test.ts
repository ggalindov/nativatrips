import { describe, expect, it, vi } from 'vitest';
import { ErrorServicio } from '../puertos';
import { crearServiciosHttp } from './serviciosHttp';

function respuesta(estado: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serviciosCon(fetchFalso: typeof fetch, token: string | null = 'token-equipo') {
  return crearServiciosHttp({ baseUrl: 'https://api.test', idioma: () => 'es', token: () => token, fetch: fetchFalso });
}

describe('autenticación contra la API', () => {
  it('cerrar sesión revoca el token en el servidor', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await serviciosCon(fetchFalso).autenticacion.cerrarSesion();

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://api.test/api/v1/auth/logout');
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-equipo');
  });

  it('pide el enlace de recuperación con el correo sin espacios', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));

    await serviciosCon(fetchFalso, null).autenticacion.solicitarRecuperacion('  andrea@ecopalacio.co ');

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://api.test/api/v1/auth/olvide-password');
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'andrea@ecopalacio.co' });
  });

  it('crea la contraseña nueva con el token del enlace', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await serviciosCon(fetchFalso, null).autenticacion.restablecerClave('token-del-enlace', 'paramo-2027');

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://api.test/api/v1/auth/restablecer-password');
    expect(JSON.parse(init?.body as string)).toEqual({ token: 'token-del-enlace', nuevaPassword: 'paramo-2027' });
  });

  it('un enlace vencido o usado se informa como tal', async () => {
    const fetchFalso = vi
      .fn<typeof fetch>()
      .mockResolvedValue(respuesta(400, { message: 'El enlace es invalido, ya fue usado o vencio; pide uno nuevo' }));

    const error = await serviciosCon(fetchFalso, null)
      .autenticacion.restablecerClave('viejo', 'paramo-2027')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorServicio);
    expect((error as ErrorServicio).codigo).toBe('enlaceRecuperacionVencido');
  });
});

describe('asistente contra la API', () => {
  it('envía el historial completo y devuelve la respuesta del asistente', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, { rol: 'assistant', contenido: 'Lleva ropa abrigada.' }));
    const mensajes = [{ rol: 'user' as const, contenido: '¿Qué debo llevar?' }];

    const r = await serviciosCon(fetchFalso, null).asistente.conversar(mensajes);

    const [url, init] = fetchFalso.mock.calls[0];
    expect(url).toBe('https://api.test/api/v1/asistente/mensajes');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ mensajes });
    expect(r).toEqual({ texto: 'Lleva ropa abrigada.', reserva: null, derivacion: null });
  });

  it('traduce la reserva sugerida (RF-20) y la derivación con el contacto (RF-22)', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(
      respuesta(200, {
        rol: 'assistant',
        contenido: 'Listo',
        reserva: { senderoId: 3, senderoNombre: 'Lagunas de Siecha', fecha: '2026-11-28' },
        derivacion: { motivo: 'PIDE_PERSONA', correo: 'reservas@ecopalacio.co', whatsapp: null },
      }),
    );

    const r = await serviciosCon(fetchFalso, null).asistente.conversar([{ rol: 'user', contenido: 'Quiero reservar Siecha' }]);

    expect(r?.reserva).toEqual({ senderoId: '3', senderoNombre: 'Lagunas de Siecha', fecha: '2026-11-28' });
    expect(r?.derivacion).toEqual({ motivo: 'PIDE_PERSONA', correo: 'reservas@ecopalacio.co', whatsapp: null });
  });

  it('el límite de mensajes (429) se informa con su código para traducirlo', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(429, { message: 'Has enviado muchos mensajes seguidos.' }));

    await expect(serviciosCon(fetchFalso, null).asistente.conversar([{ rol: 'user', contenido: 'hola' }])).rejects.toMatchObject({
      name: 'ErrorServicio',
      codigo: 'demasiadosMensajes',
    });
  });
});
