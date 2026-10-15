import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('portada', () => {
  it('abre con el páramo vivo y rota los datos del parque', async () => {
    const usuario = userEvent.setup();
    renderizarEn();
    expect(screen.getByRole('heading', { level: 1, name: 'Chingaza un páramo que respira.' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /oso andino/ })).toBeInTheDocument();
    expect(screen.getByText('+1.000 especies de flora')).toBeInTheDocument();

    const datos = screen.getByRole('group', { name: 'Datos del páramo' });
    await usuario.click(within(datos).getByRole('button', { name: 'Ver dato: Fauna' }));
    expect(await screen.findByText('167 especies de mamíferos')).toBeInTheDocument();

    expect(screen.queryByText(/PNN Chingaza · La Calera/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pausar|Reanudar|Reproducir video/ })).not.toBeInTheDocument();
  });

  it('cambia todo el sitio de idioma desde el selector y lo recuerda', async () => {
    const usuario = userEvent.setup();
    renderizarEn();
    await usuario.click(screen.getAllByRole('button', { name: /English/ })[0]);
    expect(screen.getByRole('heading', { level: 1, name: 'Chingaza a páramo that breathes.' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('nativatrips.idioma')).toBe('en');
    expect(await screen.findByRole('region', { name: 'Trails to connect with the páramo' })).toBeInTheDocument();
    expect((await screen.findAllByText('Strenuous')).length).toBeGreaterThan(0);
  });

  it('indica cómo llegar con accesos directos a Waze y Google Maps', () => {
    renderizarEn();
    const seccion = screen.getByRole('region', { name: 'Te esperamos en la puerta del páramo' });
    expect(within(seccion).getByRole('link', { name: /Ir con Waze/ })).toHaveAttribute('href', expect.stringContaining('waze.com/ul?ll=4.7324372,-73.8369286'));
    expect(within(seccion).getByRole('link', { name: /Abrir en Google Maps/ })).toHaveAttribute('href', expect.stringContaining('destination=4.7324372,-73.8369286'));
    expect(within(seccion).getByTitle('Mapa de la ubicación de la Reserva Ecopalacio Chingaza')).toBeInTheDocument();
    expect(within(seccion).getByText('Vda. La Trinidad, Guasca, Cundinamarca')).toBeInTheDocument();
  });

  it('muestra el sitio en francés y portugués', () => {
    const { unmount } = renderizarEn({ idioma: 'fr' });
    expect(screen.getByRole('heading', { level: 1, name: 'Chingaza un páramo qui respire.' })).toBeInTheDocument();
    unmount();
    renderizarEn({ idioma: 'pt' });
    expect(screen.getByRole('heading', { level: 1, name: 'Chingaza um páramo que respira.' })).toBeInTheDocument();
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
