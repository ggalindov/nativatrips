import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { crearServiciosEnMemoria } from '@/services/memoria/serviciosEnMemoria';
import { ErrorServicio } from '@/services/puertos';
import type { MensajeAsistente, RespuestaAsistente } from '@/services/puertos';
import { renderizarEn } from '@/test/renderizar';

function texto(t: string): RespuestaAsistente {
  return { texto: t, reserva: null, derivacion: null };
}

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
      .fn<(m: MensajeAsistente[]) => Promise<RespuestaAsistente | null>>()
      .mockResolvedValueOnce(texto('Lleva ropa abrigada y agua.'))
      .mockResolvedValueOnce(texto('Sí, hay cupos el sábado.'));
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
      .fn<(m: MensajeAsistente[]) => Promise<RespuestaAsistente | null>>()
      .mockRejectedValueOnce(new ErrorServicio('Has enviado muchos mensajes seguidos.', 'demasiadosMensajes'))
      .mockResolvedValueOnce(texto('Ya puedo responderte.'));
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
  it('ofrece el formulario con el sendero que el visitante quiere reservar (RF-20)', async () => {
    sessionStorage.clear();
    const conversar = vi.fn<(m: MensajeAsistente[]) => Promise<RespuestaAsistente | null>>().mockResolvedValueOnce({
      texto: 'Abre el formulario para reservar.',
      reserva: { senderoId: '3', senderoNombre: 'Lagunas de Siecha', fecha: '2026-11-28' },
      derivacion: null,
    });
    const servicios = { ...crearServiciosEnMemoria({ latenciaMs: 0 }), asistente: { conversar } };
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    await usuario.type(within(chat).getByRole('textbox'), 'Quiero reservar Siecha el 28{Enter}');

    const enlace = await within(chat).findByRole('link', { name: /^Reservar Lagunas de Siecha · / });
    expect(enlace).toHaveAttribute('href', '/reservar/3?fecha=2026-11-28');
    expect(within(chat).queryByRole('region', { name: '¿Prefieres hablar con una persona?' })).not.toBeInTheDocument();
  });

  it('muestra el contacto de inmediato si el visitante pide una persona (RF-22)', async () => {
    sessionStorage.clear();
    const conversar = vi.fn<(m: MensajeAsistente[]) => Promise<RespuestaAsistente | null>>().mockResolvedValueOnce({
      texto: 'Te dejo el contacto del equipo.',
      reserva: null,
      derivacion: { motivo: 'PIDE_PERSONA', correo: 'reservas@ecopalacio.co', whatsapp: '573000000000' },
    });
    const servicios = { ...crearServiciosEnMemoria({ latenciaMs: 0 }), asistente: { conversar } };
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    await usuario.type(within(chat).getByRole('textbox'), 'Quiero hablar con una persona{Enter}');

    const contacto = await within(chat).findByRole('region', { name: '¿Prefieres hablar con una persona?' });
    expect(within(contacto).getByRole('link', { name: 'Escribir por WhatsApp' })).toHaveAttribute('href', 'https://wa.me/573000000000');
    expect(within(contacto).getByRole('link', { name: 'Escribir por correo' })).toHaveAttribute('href', 'mailto:reservas@ecopalacio.co');
  });

  it('ofrece el contacto solo tras dos respuestas sin resolver seguidas (RF-22)', async () => {
    sessionStorage.clear();
    const sinResolver: RespuestaAsistente = {
      texto: 'No encontré esa información.',
      reserva: null,
      derivacion: { motivo: 'NO_RESUELTO', correo: 'reservas@ecopalacio.co', whatsapp: null },
    };
    const conversar = vi.fn<(m: MensajeAsistente[]) => Promise<RespuestaAsistente | null>>().mockResolvedValue(sinResolver);
    const servicios = { ...crearServiciosEnMemoria({ latenciaMs: 0 }), asistente: { conversar } };
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/senderos', servicios });

    await usuario.click(await screen.findByRole('button', { name: 'Hablar con Frailín' }));
    const chat = screen.getByRole('dialog', { name: 'Conversación con Frailín' });
    await usuario.type(within(chat).getByRole('textbox'), '¿Venden recuerdos?{Enter}');
    await within(chat).findByText('No encontré esa información.');
    expect(within(chat).queryByRole('region', { name: '¿Prefieres hablar con una persona?' })).not.toBeInTheDocument();

    await usuario.type(within(chat).getByRole('textbox'), '¿Y camisetas?{Enter}');
    const contacto = await within(chat).findByRole('region', { name: '¿Prefieres hablar con una persona?' });
    expect(within(contacto).getByRole('link', { name: 'Escribir por correo' })).toBeInTheDocument();
    expect(within(contacto).queryByRole('link', { name: 'Escribir por WhatsApp' })).not.toBeInTheDocument();
  });
});
