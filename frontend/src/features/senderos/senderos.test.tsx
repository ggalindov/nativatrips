import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('catálogo de senderos', () => {
  it('muestra los 13 senderos con su foto', async () => {
    renderizarEn({ ruta: '/senderos' });
    const resultados = await screen.findByRole('region', { name: 'Resultados' });
    expect(await within(resultados).findAllByRole('article')).toHaveLength(13);
    expect(screen.getByRole('status')).toHaveTextContent('13 senderos');
  });

  it('busca sin importar tildes y combina con la dificultad', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos' });
    await screen.findAllByRole('article');

    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar sendero' }), 'caquezas');
    expect(screen.getByRole('status')).toHaveTextContent('1 sendero');
    expect(screen.getByRole('heading', { level: 3, name: 'Los Cáquezas' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Exigente' }));
    expect(screen.getByRole('heading', { name: 'No encontramos senderos con esos filtros' })).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Quitar filtros' }));
    expect(screen.getByRole('status')).toHaveTextContent('13 senderos');
  });

  it('cambia a vista de lista', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos' });
    await screen.findAllByRole('article');
    await usuario.click(screen.getByRole('button', { name: 'Lista' }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getAllByRole('link', { name: /Ver sendero/ })).toHaveLength(13);
  });
});

describe('ficha del sendero', () => {
  it('muestra datos, galería y lleva a reservar con la fecha elegida', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos/lagunas-de-siecha' });

    expect(await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' })).toBeInTheDocument();
    expect(screen.getByText('Lagunas sagradas muiscas')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Fotos de Lagunas de Siecha' })).getAllByRole('button')).toHaveLength(5);

    const continuar = screen.getByRole('button', { name: /Continuar con esta fecha/ });
    expect(continuar).toBeDisabled();
    const dias = await screen.findByRole('group', { name: 'Elegir fecha' });
    await usuario.click(within(dias).getAllByRole('button').find((b) => !(b as HTMLButtonElement).disabled)!);
    await usuario.click(continuar);

    expect(await screen.findByRole('heading', { level: 1, name: 'Lagunas de Siecha' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Apartar cupo y pagar con PayU' })).toBeInTheDocument();
    const elegida = within(await screen.findByRole('group', { name: 'Elegir fecha' }))
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(elegida).toBeDefined();
  });

  it('informa cuando el sendero no existe', async () => {
    renderizarEn({ ruta: '/senderos/no-existe' });
    expect(await screen.findByRole('heading', { name: 'No encontramos ese sendero.' })).toBeInTheDocument();
  });
});
