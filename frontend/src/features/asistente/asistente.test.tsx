import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderizarEn } from '@/test/renderizar';

describe('Frailín, el asistente', () => {
  it('se abre, envía una sugerencia y responde con la demostración', async () => {
    sessionStorage.clear();
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos' });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    expect(within(chat).getByText(/el frailejón que cuida este páramo/)).toBeInTheDocument();

    await usuario.click(within(chat).getByRole('button', { name: '¿Qué debo llevar?' }));
    const registro = within(chat).getByRole('log');
    expect(within(registro).getByText('¿Qué debo llevar?')).toBeInTheDocument();
    expect(await within(registro).findByText(/Todavía estoy aprendiendo/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(within(chat).getByText('¿Prefieres hablar con una persona?')).toBeInTheDocument();
  });

  it('escribe con Enter y se cierra con Escape', async () => {
    sessionStorage.clear();
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', idioma: 'en' });
    await usuario.click(await screen.findByRole('button', { name: 'Chat with Frailín' }));
    await usuario.type(screen.getByRole('textbox', { name: 'Type your question…' }), 'Hello{Enter}');
    expect(within(screen.getByRole('log')).getByText('Hello')).toBeInTheDocument();
    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Chat with Frailín' })).not.toBeInTheDocument();
  });
});
