import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SesionEquipo } from '@/domain/equipo';
import { crearServiciosEnMemoria } from '@/services/memoria/serviciosEnMemoria';
import { ErrorServicio } from '@/services/puertos';
import { renderizarEn, SESION_ADMIN, SESION_GUIA } from '@/test/renderizar';
import { EVENTO_SESION_INVALIDA, leerSesionGuardada, vencimientoDelToken } from './SesionContext';

/** JWT sin firma válida: el navegador solo lee `exp`, la firma la verifica el servidor. */
function jwtQueVence(enMs: number): string {
  const carga = btoa(JSON.stringify({ sub: 'andrea', exp: Math.floor((Date.now() + enMs) / 1000) }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `eyJhbGciOiJIUzI1NiJ9.${carga}.firma`;
}

describe('sesión del equipo', () => {
  beforeEach(() => sessionStorage.clear());

  it('lee el vencimiento del JWT y no confunde un token de demostración con uno vencido', () => {
    const token = jwtQueVence(60_000);
    expect(vencimientoDelToken(token)).toBeGreaterThan(Date.now());
    expect(vencimientoDelToken('token-de-demostracion')).toBeNull();
  });

  it('una sesión guardada que ya venció no se recupera al recargar', () => {
    const vencida: SesionEquipo = { ...SESION_ADMIN, token: jwtQueVence(-60_000) };
    sessionStorage.setItem('nativatrips.sesion', JSON.stringify(vencida));

    expect(leerSesionGuardada()).toBeNull();
    expect(sessionStorage.getItem('nativatrips.sesion')).toBeNull();
  });

  it('al vencer el token la sesión se cierra sola y lo explica', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const porVencer: SesionEquipo = { ...SESION_ADMIN, token: jwtQueVence(60_000) };
      renderizarEn({ ruta: '/equipo/admin', sesion: porVencer });
      expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(61_000);
      });

      expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Tu sesión venció o se cerró');
    } finally {
      vi.useRealTimers();
    }
  });

  it('si el servidor rechaza el token, vuelve al acceso con el aviso', async () => {
    renderizarEn({ ruta: '/equipo/guia', sesion: SESION_GUIA });
    await screen.findByRole('heading', { name: 'Lagunas de Siecha' });

    act(() => {
      window.dispatchEvent(new Event(EVENTO_SESION_INVALIDA));
    });

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión venció o se cerró');
  });

  it('salir revoca el token en el servidor antes de olvidar la sesión', async () => {
    const usuario = userEvent.setup();
    const servicios = crearServiciosEnMemoria({ latenciaMs: 0 });
    const cerrarSesion = vi.spyOn(servicios.autenticacion, 'cerrarSesion');
    renderizarEn({ ruta: '/equipo/admin', sesion: SESION_ADMIN, servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Salir' }));

    expect(cerrarSesion).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    expect(screen.queryByText(/Tu sesión venció/)).not.toBeInTheDocument();
  });

  it('sin conexión, salir igual cierra la sesión en el navegador', async () => {
    const usuario = userEvent.setup();
    const servicios = crearServiciosEnMemoria({ latenciaMs: 0 });
    vi.spyOn(servicios.autenticacion, 'cerrarSesion').mockRejectedValue(new ErrorServicio('Sin red', 'sinConexion'));
    renderizarEn({ ruta: '/equipo/guia', sesion: SESION_GUIA, servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Salir' }));

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
  });
});

describe('recuperación de la contraseña', () => {
  beforeEach(() => sessionStorage.clear());

  it('pide el enlace al servidor con el correo escrito', async () => {
    const usuario = userEvent.setup();
    const servicios = crearServiciosEnMemoria({ latenciaMs: 0 });
    const solicitar = vi.spyOn(servicios.autenticacion, 'solicitarRecuperacion');
    renderizarEn({ ruta: '/equipo/recuperar', servicios });

    await usuario.type(await screen.findByLabelText('Correo de trabajo'), 'andrea@ecopalacio.co');
    await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Revisa tu correo');
    expect(solicitar).toHaveBeenCalledWith('andrea@ecopalacio.co');
  });

  it('con el enlace crea la contraseña nueva', async () => {
    const usuario = userEvent.setup();
    const servicios = crearServiciosEnMemoria({ latenciaMs: 0 });
    const restablecer = vi.spyOn(servicios.autenticacion, 'restablecerClave');
    renderizarEn({ ruta: '/equipo/recuperar?token=token-del-enlace', servicios });

    await usuario.type(await screen.findByLabelText('Contraseña nueva'), 'corta');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText('Usa al menos 8 caracteres.')).toBeInTheDocument();
    expect(restablecer).not.toHaveBeenCalled();

    await usuario.clear(screen.getByLabelText('Contraseña nueva'));
    await usuario.type(screen.getByLabelText('Contraseña nueva'), 'paramo-2027');
    await usuario.type(screen.getByLabelText('Repite la contraseña'), 'paramo-2028');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();

    await usuario.clear(screen.getByLabelText('Repite la contraseña'));
    await usuario.type(screen.getByLabelText('Repite la contraseña'), 'paramo-2027');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Contraseña actualizada');
    expect(restablecer).toHaveBeenCalledWith('token-del-enlace', 'paramo-2027');
  });

  it('un enlace vencido ofrece pedir otro', async () => {
    const usuario = userEvent.setup();
    const servicios = crearServiciosEnMemoria({ latenciaMs: 0 });
    vi.spyOn(servicios.autenticacion, 'restablecerClave').mockRejectedValue(
      new ErrorServicio('Vencido', 'enlaceRecuperacionVencido'),
    );
    renderizarEn({ ruta: '/equipo/recuperar?token=viejo', servicios });

    await usuario.type(await screen.findByLabelText('Contraseña nueva'), 'paramo-2027');
    await usuario.type(screen.getByLabelText('Repite la contraseña'), 'paramo-2027');
    await usuario.click(screen.getByRole('button', { name: 'Guardar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace venció o ya se usó');
    expect(screen.getByRole('link', { name: 'Pedir otro enlace' })).toHaveAttribute('href', '/equipo/recuperar');
  });
});
