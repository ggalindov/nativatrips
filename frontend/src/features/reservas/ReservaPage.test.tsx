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
    await usuario.type(screen.getByLabelText('Número de documento'), '1020304050');
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

  it('registra a un visitante extranjero con pasaporte e indicativo internacional', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });
    await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' });
    await elegirPrimeraFechaDisponible(usuario);

    await usuario.type(screen.getByLabelText('Nombre completo'), 'Claire Martin');
    await usuario.click(screen.getByRole('radio', { name: /Extranjera/ }));
    expect(screen.getByRole('note')).toHaveTextContent('Visitantes extranjeros');
    await usuario.selectOptions(screen.getByLabelText('Nacionalidad'), 'FR');
    expect(screen.getByLabelText('Tipo de documento')).toHaveValue('PASAPORTE');
    expect(screen.getByLabelText('Indicativo')).toHaveValue('33');
    await usuario.type(screen.getByLabelText('Número de documento'), '19ab12345');
    await usuario.type(screen.getByLabelText('Correo'), 'claire@exemple.fr');
    await usuario.type(screen.getByLabelText('Celular'), '612345678');
    await usuario.click(screen.getByRole('button', { name: 'Apartar cupo y pagar con PayU' }));

    expect(await screen.findByRole('heading', { name: 'Tu cupo está apartado.' })).toBeInTheDocument();
    await usuario.click(screen.getByRole('link', { name: /Abrir el enlace/ }));
    const visitantes = await screen.findByRole('list', { name: 'Acompañantes' });
    expect(within(visitantes).getByText('Pasaporte 19AB12345')).toBeInTheDocument();
  });

  it('pide un documento válido para extranjeros', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });
    await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' });
    await usuario.click(screen.getByRole('radio', { name: /Extranjera/ }));
    await usuario.type(screen.getByLabelText('Número de documento'), 'AB 1');
    await usuario.click(screen.getByRole('button', { name: 'Apartar cupo y pagar con PayU' }));
    expect(screen.getByRole('alert')).toHaveTextContent('entre 5 y 20 letras o números');
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
    const lista = screen.getByRole('main').querySelector('ul')!;
    expect(within(lista).getAllByRole('button', { name: /h$/ }).length).toBe(13);
  });
});
