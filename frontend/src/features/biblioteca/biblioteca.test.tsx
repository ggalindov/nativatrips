import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('biblioteca de fotos', () => {
  it('muestra las fotos con licencia mientras no haya contenido propio', async () => {
    renderizarEn({ ruta: '/biblioteca' });
    const lista = await screen.findByRole('list', { name: 'Fotos y videos' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(28);
    expect(screen.getByText(/Fotografías con licencia libre/)).toBeInTheDocument();
  });

  it('filtra por categoría y muestra cuántas hay en cada una', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/biblioteca' });
    const lista = await screen.findByRole('list', { name: 'Fotos y videos' });

    const fauna = screen.getByRole('button', { name: /^Fauna/ });
    expect(fauna).toHaveTextContent('3');
    await usuario.click(fauna);
    expect(fauna).toHaveAttribute('aria-pressed', 'true');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3);
  });
});

describe('carrusel de la portada', () => {
  it('se alimenta de la biblioteca y enlaza a ella', async () => {
    renderizarEn();
    const carrusel = await screen.findByRole('list', { name: 'Carrusel de fotos del páramo' });
    // Cinco fotos accesibles; la copia que hace continua la franja del celular queda oculta para lectores de pantalla.
    expect(within(carrusel).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Foto siguiente' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver la biblioteca/ })).toHaveAttribute('href', '/biblioteca');
  });
});
