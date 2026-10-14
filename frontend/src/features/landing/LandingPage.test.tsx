import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('portada', () => {
  it('arranca el ascenso en el bosque altoandino con su primer dato', () => {
    renderizarEn();
    expect(screen.getByRole('heading', { level: 1, name: 'Sube el páramo paso a paso.' })).toBeInTheDocument();
    expect(screen.getByTestId('altimetro')).toHaveTextContent('3.000');
    expect(screen.getByText('1/5 · Bosque altoandino')).toBeInTheDocument();
    expect(screen.getByText('+1.000 especies de flora')).toBeInTheDocument();
    const tramos = screen.getByRole('list', { name: 'Tramos del ascenso' });
    expect(within(tramos).getAllByRole('listitem')).toHaveLength(5);
  });

  it('destaca seis senderos con foto y filtra por dificultad', async () => {
    const usuario = userEvent.setup();
    renderizarEn();
    const seccion = await screen.findByRole('region', { name: /Rutas para conectar/ });
    expect(await within(seccion).findAllByRole('article')).toHaveLength(6);

    await usuario.click(within(seccion).getByRole('button', { name: 'Exigente' }));
    const titulos = within(seccion).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Cuchilla el Zaque', 'Chorreras']);
  });

  it('cada tarjeta lleva a la ficha del sendero', async () => {
    renderizarEn();
    const seccion = await screen.findByRole('region', { name: /Rutas para conectar/ });
    const tarjeta = (await within(seccion).findAllByRole('article')).find((a) => within(a).queryByText('La Paila'))!;
    expect(within(tarjeta).getByRole('link', { name: /Ver sendero/ })).toHaveAttribute('href', '/senderos/la-paila');
  });
});
