import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('portada', () => {
  it('arranca el descenso en la cumbre', async () => {
    renderizarEn();
    expect(screen.getByRole('heading', { level: 1, name: 'El páramo se recorre despacio.' })).toBeInTheDocument();
    expect(screen.getByTestId('altimetro')).toHaveTextContent('3.900');
    expect(screen.getByText('1/4 · Cumbre')).toBeInTheDocument();
  });

  it('lista los 13 senderos y filtra por dificultad', async () => {
    const usuario = userEvent.setup();
    renderizarEn();
    const lista = await screen.findByRole('list', { name: 'Senderos' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(13);

    await usuario.click(screen.getByRole('button', { name: 'Exigente' }));
    expect(screen.getByRole('button', { name: 'Exigente' })).toHaveAttribute('aria-pressed', 'true');
    const exigentes = within(lista).getAllByRole('link');
    expect(exigentes.map((a) => a.textContent)).toEqual([
      expect.stringContaining('Cuchilla el Zaque'),
      expect.stringContaining('Chorreras'),
    ]);
  });

  it('enlaza cada sendero con su reserva', async () => {
    renderizarEn();
    const enlace = await screen.findByRole('link', { name: /Lagunas de Siecha/ });
    expect(enlace).toHaveAttribute('href', '/reservar/lagunas-de-siecha');
  });
});
