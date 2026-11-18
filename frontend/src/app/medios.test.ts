import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { medioNoDisponible, medioPrecargado, precargarMedio, reiniciarMedios, suscribirMedios } from './medios';

function respuesta(tipo: string, estado = 200) {
  return new Response('datos', { status: estado, headers: { 'content-type': tipo } });
}

describe('precarga de medios', () => {
  beforeEach(() => {
    reiniciarMedios();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:video'), revokeObjectURL: vi.fn() }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('deja el video en memoria y avisa a quien espera', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta('video/mp4')));
    const oyente = vi.fn();
    suscribirMedios(oyente);

    await precargarMedio('/media/a.mp4');

    expect(medioPrecargado('/media/a.mp4')).toBe('blob:video');
    expect(medioNoDisponible('/media/a.mp4')).toBe(false);
    expect(oyente).toHaveBeenCalled();
  });

  it('si el servidor responde con la página del sitio, el video no está disponible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta('text/html')));

    await precargarMedio('/media/b.mp4');

    expect(medioPrecargado('/media/b.mp4')).toBeUndefined();
    expect(medioNoDisponible('/media/b.mp4')).toBe(true);
  });

  it('un 404 o un error de red tampoco rompen la carga', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(respuesta('video/mp4', 404)).mockRejectedValueOnce(new Error('sin red')));

    await expect(precargarMedio('/media/c.mp4')).resolves.toBeUndefined();
    await expect(precargarMedio('/media/d.mp4')).resolves.toBeUndefined();

    expect(medioNoDisponible('/media/c.mp4')).toBe(true);
    expect(medioNoDisponible('/media/d.mp4')).toBe(true);
  });

  it('con mala señal la pantalla de carga deja de esperar y el video sigue bajando', async () => {
    vi.useFakeTimers();
    let entregar: (r: Response) => void = () => {};
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((r) => (entregar = r))));

    const espera = precargarMedio('/media/e.mp4', { esperaMaximaMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(espera).resolves.toBeUndefined();
    expect(medioPrecargado('/media/e.mp4')).toBeUndefined();

    entregar(respuesta('video/mp4'));
    await vi.runAllTimersAsync();
    expect(medioPrecargado('/media/e.mp4')).toBe('blob:video');
  });

  it('descarga cada archivo una sola vez', async () => {
    const descarga = vi.fn(async () => respuesta('video/mp4'));
    vi.stubGlobal('fetch', descarga);

    await Promise.all([precargarMedio('/media/f.mp4'), precargarMedio('/media/f.mp4')]);

    expect(descarga).toHaveBeenCalledTimes(1);
  });
});
