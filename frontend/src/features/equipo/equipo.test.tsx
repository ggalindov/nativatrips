import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderizarEn, SESION_ADMIN, SESION_GUIA } from '@/test/renderizar';

describe('acceso del equipo y paneles por rol', () => {
  beforeEach(() => sessionStorage.clear());

  it('sin sesión, un panel redirige al acceso', async () => {
    renderizarEn({ ruta: '/equipo/gerencia' });
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('cada rol entra a su propio panel', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });

    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'gerencia@ecopalacio.co');
    await usuario.type(screen.getByLabelText('Contraseña'), 'paramo2026');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('heading', { name: 'Resumen de octubre' })).toBeInTheDocument();
  });

  it('muestra el error con credenciales incorrectas', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'admin@ecopalacio.co');
    await usuario.type(screen.getByLabelText('Contraseña'), 'equivocada');
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
  });

  it('un rol no puede abrir el panel de otro', async () => {
    renderizarEn({ ruta: '/equipo/gerencia', sesion: SESION_GUIA });
    expect(await screen.findByRole('heading', { name: 'Lagunas de Siecha' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resumen de octubre' })).not.toBeInTheDocument();
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

  it('administrativo aprueba una reserva en revisión', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/administrativo', sesion: SESION_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Aprobar NT-7Q4K' }));
    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Confirmada');
  });
});
