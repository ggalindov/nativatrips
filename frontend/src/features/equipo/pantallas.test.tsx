import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SesionEquipo } from '@/domain/equipo';
import { renderizarEn, SESION_ADMIN, SESION_GUIA } from '@/test/renderizar';

const SESION_GERENCIA: SesionEquipo = { nombre: 'Carlos Palacio', correo: 'gerencia@ecopalacio.co', rol: 'GERENCIA', token: 't' };

describe('pantallas del personal', () => {
  beforeEach(() => sessionStorage.clear());

  it('administrativo filtra reservas con extranjeros y abre el detalle', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/administrativo/reservas', sesion: SESION_ADMIN });
    await usuario.selectOptions(await screen.findByLabelText('Procedencia'), 'extranjeros');
    const lista = screen.getByRole('region', { name: 'Lista de reservas' });
    expect(within(lista).getByText('Claire Martin')).toBeInTheDocument();
    expect(within(lista).queryByText('Pedro Sánchez')).not.toBeInTheDocument();

    await usuario.click(within(lista).getByRole('button', { name: 'Ver reserva NT-5HC1' }));
    expect((await screen.findAllByText('Pasaporte 19AB12345')).length).toBeGreaterThan(0);
    expect(screen.getByText(/tarifa diferenciada/)).toBeInTheDocument();
  });

  it('el menú lleva a cada sección del personal administrativo', async () => {
    renderizarEn({ ruta: '/equipo/administrativo/capacidad', sesion: SESION_ADMIN });
    expect(await screen.findByRole('heading', { level: 1, name: 'Capacidad' })).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Panel' });
    expect(within(menu).getAllByRole('link')).toHaveLength(8);
  });

  it('gerencia crea una cuenta del equipo', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/gerencia/equipo', sesion: SESION_GERENCIA });
    await usuario.click(await screen.findByRole('button', { name: 'Nueva cuenta' }));
    await usuario.type(screen.getByLabelText('Nombre completo'), 'Paula Rincón');
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'paula@ecopalacio.co');
    await usuario.click(screen.getByRole('button', { name: 'Crear y enviar invitación' }));
    expect(within(screen.getByRole('list', { name: 'Cuentas del equipo' })).getByText('Paula Rincón')).toBeInTheDocument();
  });

  it('gerencia ve el tablero con NPS y procedencia de los visitantes', async () => {
    renderizarEn({ ruta: '/equipo/gerencia', sesion: SESION_GERENCIA });
    expect(await screen.findByRole('heading', { name: 'Satisfacción (NPS)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Procedencia de los visitantes' })).toBeInTheDocument();
  });

  it('el guía cierra el tour y consulta su agenda', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/guia', sesion: SESION_GUIA });
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar el tour' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cierre' }));
    expect(await screen.findByText('Tour cerrado · encuesta enviada')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Agenda' }));
    expect(screen.getByRole('heading', { name: 'Mi agenda' })).toBeInTheDocument();
  });

  it('recupera el acceso sin revelar si el correo existe', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });
    await usuario.click(await screen.findByRole('link', { name: '¿Olvidaste tu contraseña?' }));
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'nadie@ecopalacio.co');
    await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
    expect(screen.getByRole('status')).toHaveTextContent('Si nadie@ecopalacio.co pertenece a una cuenta');
  });
});
