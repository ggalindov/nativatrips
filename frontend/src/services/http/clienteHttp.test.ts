import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorServicio } from '../puertos';
import { crearClienteHttp } from './clienteHttp';

function respuesta(estado: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

function clienteCon(fetchFalso: typeof fetch, token: string | null = null) {
  return crearClienteHttp({ baseUrl: 'https://api.test', idioma: () => 'en', token: () => token, fetch: fetchFalso });
}

async function errorDe(promesa: Promise<unknown>): Promise<ErrorServicio> {
  try {
    await promesa;
  } catch (e) {
    if (e instanceof ErrorServicio) return e;
    throw e;
  }
  throw new Error('La petición no falló');
}

describe('cliente HTTP', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('envía el idioma activo, el token de la sesión y el cuerpo como JSON', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, { ok: true }));

    const datos = await clienteCon(fetchFalso, 'token-equipo').pedir<{ ok: boolean }>('/api/v1/senderos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Sendero' }),
    });

    expect(datos).toEqual({ ok: true });
    const [url, init] = fetchFalso.mock.calls[0];
    const cabeceras = new Headers(init?.headers);
    expect(url).toBe('https://api.test/api/v1/senderos');
    expect(cabeceras.get('Accept-Language')).toBe('en');
    expect(cabeceras.get('Authorization')).toBe('Bearer token-equipo');
    expect(cabeceras.get('Content-Type')).toBe('application/json');
  });

  it('no envía Authorization ni Content-Type en una consulta pública', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(200, []));

    await clienteCon(fetchFalso).pedir('/api/v1/senderos');

    const cabeceras = new Headers(fetchFalso.mock.calls[0][1]?.headers);
    expect(cabeceras.has('Authorization')).toBe(false);
    expect(cabeceras.has('Content-Type')).toBe(false);
  });

  it.each([
    [400, 'datosInvalidos'],
    [401, 'credenciales'],
    [500, 'servidor'],
    [503, 'servidor'],
  ] as const)('traduce el estado %i al código %s', async (estado, codigo) => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(estado, { message: 'detalle' }));

    expect((await errorDe(clienteCon(fetchFalso).pedir('/x'))).codigo).toBe(codigo);
  });

  it('conserva el mensaje del servidor cuando el error no tiene código, como un cupo agotado', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(
      respuesta(409, { message: 'El cupo maximo del sendero para esta fecha ha sido excedido' }),
    );

    const error = await errorDe(clienteCon(fetchFalso).pedir('/x'));

    expect(error.codigo).toBeNull();
    expect(error.message).toBe('El cupo maximo del sendero para esta fecha ha sido excedido');
  });

  it('informa falta de conexión cuando la red falla', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));

    expect((await errorDe(clienteCon(fetchFalso).pedir('/x'))).codigo).toBe('sinConexion');
  });

  it('corta la petición al pasar el tiempo límite y lo informa como falta de conexión', async () => {
    vi.useFakeTimers();
    const fetchFalso = vi.fn<typeof fetch>((_, init) =>
      new Promise<Response>((_, rechazar) => {
        init?.signal?.addEventListener('abort', () => rechazar(new DOMException('Abortada', 'AbortError')));
      }),
    );
    const cliente = crearClienteHttp({ baseUrl: '', idioma: () => 'es', tiempoLimiteMs: 1000, fetch: fetchFalso });

    const pendiente = errorDe(cliente.pedir('/lenta'));
    await vi.advanceTimersByTimeAsync(1000);

    expect((await pendiente).codigo).toBe('sinConexion');
  });

  it('devuelve undefined en una respuesta sin contenido', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(clienteCon(fetchFalso).pedir('/x', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('acepta un 202 sin cuerpo, como la solicitud de recuperación', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 202 }));

    await expect(clienteCon(fetchFalso).pedir('/x', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('avisa la sesión vencida cuando el servidor rechaza el token', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(401, { message: 'Token revocado' }));
    const alSesionInvalida = vi.fn();
    const cliente = crearClienteHttp({
      baseUrl: 'https://api.test',
      idioma: () => 'es',
      token: () => 'token-revocado',
      alSesionInvalida,
      fetch: fetchFalso,
    });

    expect((await errorDe(cliente.pedir('/api/v1/reservas/en-revision'))).codigo).toBe('sesionVencida');
    expect(alSesionInvalida).toHaveBeenCalledOnce();
  });

  it('un 401 sin sesión son credenciales incorrectas, no una sesión vencida', async () => {
    const fetchFalso = vi.fn<typeof fetch>().mockResolvedValue(respuesta(401, { message: 'Credenciales invalidas' }));
    const alSesionInvalida = vi.fn();
    const cliente = crearClienteHttp({
      baseUrl: 'https://api.test',
      idioma: () => 'es',
      token: () => null,
      alSesionInvalida,
      fetch: fetchFalso,
    });

    expect((await errorDe(cliente.pedir('/api/v1/auth/login', { method: 'POST', body: '{}' }))).codigo).toBe('credenciales');
    expect(alSesionInvalida).not.toHaveBeenCalled();
  });
});
