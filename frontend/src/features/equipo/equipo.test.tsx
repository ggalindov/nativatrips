import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizarEn, SESION_ADMIN, SESION_GUIA } from '@/test/renderizar';

describe('acceso del equipo y paneles por rol', () => {
  beforeEach(() => sessionStorage.clear());

  it('sin sesión, un panel redirige al acceso', async () => {
    renderizarEn({ ruta: '/equipo/admin' });
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('el administrador entra a su panel', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });

    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'admin@ecopalacio.co');
    await usuario.type(screen.getByLabelText('Contraseña'), 'paramo2026');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();
  });

  it('las direcciones de los paneles anteriores llevan al del administrador', async () => {
    renderizarEn({ ruta: '/equipo/gerencia/equipo', sesion: SESION_ADMIN });
    expect(await screen.findByRole('heading', { level: 1, name: 'Hoy' })).toBeInTheDocument();
  });

  it('muestra el error con credenciales incorrectas', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'admin@ecopalacio.co');
    await usuario.type(screen.getByLabelText('Contraseña'), 'equivocada');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  });

  it('el guía no puede abrir el panel del administrador', async () => {
    renderizarEn({ ruta: '/equipo/admin/usuarios', sesion: SESION_GUIA });
    expect(await screen.findByRole('heading', { name: 'Lagunas de Siecha' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Usuarios' })).not.toBeInTheDocument();
  });

  it('el guía marca asistencia tocando cada nombre', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/guia', sesion: SESION_GUIA });
    const sara = await screen.findByRole('button', { name: /Sara Molina/ });

    expect(screen.getByTestId('asistencia')).toHaveTextContent('2/16');
    await usuario.click(sara);
    expect(sara).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('asistencia')).toHaveTextContent('3/16');
  });

  it('el administrador aprueba una reserva en revisión', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin', sesion: SESION_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Aprobar NT-7Q4K' }));
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Confirmada');
  });
});
