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
