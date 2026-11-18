import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { crearServiciosEnMemoria } from '@/services/memoria/serviciosEnMemoria';
import { ErrorServicio } from '@/services/puertos';
import type { MensajeAsistente } from '@/services/puertos';
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

  it('con servidor muestra la respuesta real y reenvía la conversación completa', async () => {
    sessionStorage.clear();
    const conversar = vi
      .fn<(m: MensajeAsistente[]) => Promise<string | null>>()
      .mockResolvedValueOnce('Lleva ropa abrigada y agua.')
      .mockResolvedValueOnce('Sí, hay cupos el sábado.');
    const servicios = { ...crearServiciosEnMemoria({ latenciaMs: 0 }), asistente: { conversar } };
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    await usuario.type(within(chat).getByRole('textbox'), '¿Qué debo llevar?{Enter}');
    expect(await within(chat).findByText('Lleva ropa abrigada y agua.')).toBeInTheDocument();
    await usuario.type(within(chat).getByRole('textbox'), '¿Hay cupos?{Enter}');
    expect(await within(chat).findByText('Sí, hay cupos el sábado.')).toBeInTheDocument();

    expect(conversar).toHaveBeenLastCalledWith([
      { rol: 'user', contenido: '¿Qué debo llevar?' },
      { rol: 'assistant', contenido: 'Lleva ropa abrigada y agua.' },
      { rol: 'user', contenido: '¿Hay cupos?' },
    ]);
  });

  it('si el servidor limita los mensajes lo dice en el idioma activo y no lo reenvía como respuesta', async () => {
    sessionStorage.clear();
    const conversar = vi
      .fn<(m: MensajeAsistente[]) => Promise<string | null>>()
      .mockRejectedValueOnce(new ErrorServicio('Has enviado muchos mensajes seguidos.', 'demasiadosMensajes'))
      .mockResolvedValueOnce('Ya puedo responderte.');
    const servicios = { ...crearServiciosEnMemoria({ latenciaMs: 0 }), asistente: { conversar } };
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    await usuario.type(within(chat).getByRole('textbox'), 'Hola{Enter}');
    expect(await within(chat).findByText('Enviaste muchos mensajes seguidos. Escríbenos de nuevo en un rato.')).toBeInTheDocument();

    await usuario.type(within(chat).getByRole('textbox'), 'Otra vez{Enter}');
    expect(await within(chat).findByText('Ya puedo responderte.')).toBeInTheDocument();
    // El aviso de límite no viaja al servidor como si Frailín lo hubiera dicho.
    expect(conversar).toHaveBeenLastCalledWith([
      { rol: 'user', contenido: 'Hola' },
      { rol: 'user', contenido: 'Otra vez' },
    ]);
  });
});
