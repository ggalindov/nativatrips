import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { cuposLibres } from '@/domain/aforo';
import { hoyIso, sumarDias } from '@/domain/fechas';
import { SESION_ADMIN, renderizarEn } from '@/test/renderizar';

async function datosDelTitular(usuario: ReturnType<typeof userEvent.setup>) {
  const grupo = await screen.findByRole('group', { name: 'Elegir fecha' });
  await usuario.click(within(grupo).getAllByRole('button').find((b) => !(b as HTMLButtonElement).disabled)!);
  await usuario.type(screen.getByLabelText('Nombre completo'), 'Colegio Los Andes');
  await usuario.type(screen.getByLabelText('Número de documento'), '1020304050');
  await usuario.type(screen.getByLabelText('Correo'), 'rectoria@losandes.edu.co');
  await usuario.type(screen.getByLabelText('Celular'), '3001234567');
}

describe('grupos que revisa el equipo (RF-09)', () => {
  it('un grupo corporativo envía la solicitud y queda en revisión, sin pago', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });
    await datosDelTitular(usuario);

    await usuario.click(screen.getByRole('radio', { name: /Grupo corporativo o institucional/ }));
    expect(screen.getAllByText(/El pago se habilita al aprobarse/).length).toBeGreaterThan(0);
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitud al equipo' }));

    expect(await screen.findByRole('heading', { name: 'Tu solicitud está en revisión.' })).toBeInTheDocument();
    expect(screen.getByText('En revisión')).toBeInTheDocument();
  });

  it('un grupo con necesidades especiales debe contar qué necesita', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/reservar/lagunas-de-siecha' });
    await datosDelTitular(usuario);

    await usuario.click(screen.getByRole('radio', { name: /Grupo con necesidades especiales/ }));
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitud al equipo' }));
    expect(await screen.findByText('Cuéntanos qué necesita el grupo para preparar la salida.', { selector: 'li' })).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Qué debe saber el guía'), 'Una persona en silla de ruedas');
    await usuario.click(screen.getByRole('button', { name: 'Enviar solicitud al equipo' }));
    expect(await screen.findByRole('heading', { name: 'Tu solicitud está en revisión.' })).toBeInTheDocument();
  });
});

describe('historial por correo (RF-36)', () => {
  it('pide el enlace con el correo y responde igual exista o no', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/mi-reserva' });
    await usuario.click(await screen.findByRole('link', { name: /ver todas tus reservas/ }));
    await usuario.type(await screen.findByLabelText('Correo'), 'laura@correo.co');
    await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Si hay reservas con ese correo');
  });

  it('un enlace de historial inventado no muestra nada y ofrece pedir otro', async () => {
    renderizarEn({ ruta: '/mis-reservas/inventado' });

    expect(await screen.findByRole('link', { name: 'Pedir un enlace nuevo →' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Tu historial' })).not.toBeInTheDocument();
  });
});

describe('panel en vivo (RF-08)', () => {
  it('una reserva nueva aparece en el panel sin recargar', async () => {
    const { servicios } = renderizarEn({ ruta: '/equipo/admin', sesion: SESION_ADMIN });
    expect(await screen.findByText('Aún no llegan reservas nuevas en esta sesión.')).toBeInTheDocument();

    const dias = await servicios.senderos.disponibilidad('la-paila', sumarDias(hoyIso(), 1), 30);
    const dia = dias.find((d) => cuposLibres(d) >= 2)!;
    await act(() =>
      servicios.reservas.crear({
        senderoId: 'la-paila', fecha: dia.fecha, personas: 2, tipoGrupo: 'ESTANDAR', requerimientos: '',
        titular: { nombre: 'Sara Molina', tipoDocumento: 'CC', documento: '1020304050', nacionalidad: 'CO', correo: 'sara@correo.co', indicativo: '57', celular: '3001234567' },
      }),
    );

    const enVivo = screen.getByRole('region', { name: 'En vivo' });
    expect(await within(enVivo).findByText(/Nueva reserva NT-.* de Sara Molina · La Paila/)).toBeInTheDocument();
  });
});
