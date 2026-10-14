import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('portada', () => {
  it('abre con el páramo vivo y rota los datos del parque', async () => {
    const usuario = userEvent.setup();
    renderizarEn();
    expect(screen.getByRole('heading', { level: 1, name: 'Un páramo que respira.' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /oso andino/ })).toBeInTheDocument();
    expect(screen.getByText('+1.000 especies de flora')).toBeInTheDocument();

    const datos = screen.getByRole('group', { name: 'Datos del páramo' });
    await usuario.click(within(datos).getByRole('button', { name: 'Ver dato: Fauna' }));
    expect(await screen.findByText('167 especies de mamíferos')).toBeInTheDocument();

    const pausa = screen.getByRole('button', { name: 'Pausar' });
    await usuario.click(pausa);
    expect(pausa).toHaveAttribute('aria-pressed', 'true');
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
