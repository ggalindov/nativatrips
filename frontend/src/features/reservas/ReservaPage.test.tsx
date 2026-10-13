import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

async function elegirPrimeraFechaDisponible(usuario: ReturnType<typeof userEvent.setup>) {
  const grupo = await screen.findByRole('group', { name: 'Elegir fecha' });
  const fecha = within(grupo).getAllByRole('button').find((b) => !(b as HTMLButtonElement).disabled)!;
  await usuario.click(fecha);
  return fecha;
}

describe('reserva sin cuenta', () => {
  it('reserva, aparta el cupo y abre la reserva con el enlace mágico', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' })).toBeInTheDocument();
    const fecha = await elegirPrimeraFechaDisponible(usuario);
    expect(fecha).toHaveAttribute('aria-pressed', 'true');

    await usuario.type(screen.getByLabelText('Nombre completo'), 'Laura Gómez');
    await usuario.type(screen.getByLabelText('Documento'), '1020304050');
    await usuario.type(screen.getByLabelText('Correo'), 'laura@correo.co');
    await usuario.type(screen.getByLabelText('Celular'), '3001234567');
    await usuario.click(screen.getByRole('button', { name: 'Apartar cupo y pagar con PayU' }));

    expect(await screen.findByRole('heading', { name: 'Tu cupo está apartado.' })).toBeInTheDocument();
    expect(screen.getByText('laura@correo.co')).toBeInTheDocument();

    await usuario.click(screen.getByRole('link', { name: /Abrir el enlace/ }));
    expect(await screen.findByRole('heading', { name: 'Falta el pago' })).toBeInTheDocument();
    const recorrido = screen.getByRole('list', { name: 'Estado de la reserva' });
    expect(within(recorrido).getByText('Pendiente de pago').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('explica los datos que faltan sin enviar la reserva', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });
    await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' });

    await usuario.click(screen.getByRole('button', { name: 'Apartar cupo y pagar con PayU' }));
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Elige una fecha.');
    expect(alerta).toHaveTextContent('Escribe un correo válido');
  });

  it('no deja sumar más personas que los cupos del día', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/la-paila' });
    await screen.findByRole('heading', { level: 1, name: 'La Paila' });

    expect(screen.getByRole('button', { name: 'Agregar una persona' })).toBeDisabled();
    await elegirPrimeraFechaDisponible(usuario);
    expect(screen.getByText(/Máximo \d+ para esta fecha/)).toBeInTheDocument();
  });

  it('sin sendero elegido, muestra el catálogo para escoger uno', async () => {
    renderizarEn({ ruta: '/reservar' });
    expect(await screen.findByRole('heading', { name: '¿Qué sendero quieres recorrer?' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /h$/ }).length).toBe(13);
  });
});
