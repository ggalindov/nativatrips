import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarEn, SESION_ADMIN, SESION_GUIA } from '@/test/renderizar';

describe('pantallas del personal', () => {
  beforeEach(() => sessionStorage.clear());

  it('el administrador filtra reservas con extranjeros y abre el detalle', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/reservas', sesion: SESION_ADMIN });
    await usuario.selectOptions(await screen.findByLabelText('Procedencia'), 'extranjeros');
    const lista = screen.getByRole('region', { name: 'Lista de reservas' });
    expect(within(lista).getByText('Claire Martin')).toBeInTheDocument();
    expect(within(lista).queryByText('Pedro Sánchez')).not.toBeInTheDocument();

    await usuario.click(within(lista).getByRole('button', { name: 'Ver reserva NT-5HC1' }));
    expect((await screen.findAllByText('Pasaporte 19AB12345')).length).toBeGreaterThan(0);
    expect(screen.getByText(/tarifa diferenciada/)).toBeInTheDocument();
  });

  it('el administrador corrige los datos de una reserva', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/reservas', sesion: SESION_ADMIN });
    const lista = await screen.findByRole('region', { name: 'Lista de reservas' });
    await usuario.click(within(lista).getByRole('button', { name: 'Ver reserva NT-5HC1' }));
    await usuario.click(await screen.findByRole('button', { name: 'Editar datos' }));
    const formulario = screen.getByRole('form', { name: 'Editar datos de la reserva' });
    const nombre = within(formulario).getByLabelText('Nombre del titular');
    await usuario.clear(nombre);
    await usuario.type(nombre, 'Claire Dubois');
    await usuario.click(within(formulario).getByRole('button', { name: 'Guardar datos' }));
    expect((await screen.findAllByText('Datos de NT-5HC1 actualizados')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Claire Dubois').length).toBeGreaterThan(0);
  });

  it('un solo menú reúne operación, contenido, indicadores y accesos', async () => {
    renderizarEn({ ruta: '/equipo/admin/capacidad', sesion: SESION_ADMIN });
    expect(await screen.findByRole('heading', { level: 1, name: 'Capacidad' })).toBeInTheDocument();
    const menu = screen.getByRole('navigation', { name: 'Panel' });
    expect(within(menu).getAllByRole('link')).toHaveLength(11);
    for (const seccion of ['Recorridos', 'Biblioteca', 'Usuarios', 'Resumen del mes']) expect(within(menu).getByRole('link', { name: seccion })).toBeInTheDocument();
  });

  it('el administrador crea, edita y elimina cuentas del equipo', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/usuarios', sesion: SESION_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Nueva cuenta' }));
    await usuario.type(screen.getByLabelText('Nombre completo'), 'Paula Rincón');
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'paula@ecopalacio.co');
    await usuario.click(screen.getByRole('button', { name: 'Crear y enviar invitación' }));
    const lista = screen.getByRole('list', { name: 'Cuentas del equipo' });
    expect(within(lista).getByText('Paula Rincón')).toBeInTheDocument();

    await usuario.click(within(lista).getByRole('button', { name: 'Editar a Paula Rincón' }));
    await usuario.selectOptions(screen.getByLabelText('Rol'), 'ADMINISTRADOR');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect((await screen.findAllByText('Cuenta de Paula Rincón actualizada')).length).toBeGreaterThan(0);

    await usuario.click(within(lista).getByRole('button', { name: 'Editar a Paula Rincón' }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(within(lista).queryByText('Paula Rincón')).not.toBeInTheDocument();
  });

  it('el administrador no puede quitarse su propio rol ni borrar su cuenta', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/usuarios', sesion: SESION_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Editar a Andrea Ruiz' }));
    expect(screen.getByLabelText('Rol')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Eliminar cuenta' })).not.toBeInTheDocument();
  });

  it('el administrador edita la operación y las tarifas de un recorrido', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/recorridos', sesion: SESION_ADMIN });
    await usuario.click(await screen.findByRole('button', { name: 'Editar La Paila' }));
    await usuario.click(screen.getByRole('tab', { name: 'Operación' }));
    await usuario.click(screen.getByRole('button', { name: 'lunes' }));
    await usuario.click(screen.getByRole('button', { name: '+ Agregar horario' }));
    await usuario.click(screen.getByRole('tab', { name: 'Tarifas' }));
    const tarifa = screen.getByLabelText('Tarifa nacional');
    await usuario.clear(tarifa);
    await usuario.type(tarifa, '99000');
    await usuario.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const tarjeta = within(screen.getByRole('list', { name: 'Recorridos' })).getByText('La Paila').closest('li')!;
    expect(tarjeta).toHaveTextContent(/99\.000/);
    expect(tarjeta).toHaveTextContent('L M X J V S D · 09:30, 13:00');
  });

  it('el administrador duplica y elimina un recorrido', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/admin/recorridos', sesion: SESION_ADMIN });
    const lista = await screen.findByRole('list', { name: 'Recorridos' });
    await usuario.click(within(within(lista).getByText('La Paila').closest('li')!).getByRole('button', { name: 'Duplicar' }));
    expect(within(lista).getByText('La Paila (copia)')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Editar La Paila (copia)' }));
    await usuario.click(screen.getByRole('button', { name: 'Eliminar recorrido' }));
    await usuario.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(within(lista).queryByText('La Paila (copia)')).not.toBeInTheDocument();
  });

  describe('biblioteca', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      URL.createObjectURL = vi.fn(() => 'blob:prueba');
    });
    afterEach(() => vi.useRealTimers());

    it('el administrador sube una foto, la describe y la publica', async () => {
      const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderizarEn({ ruta: '/equipo/admin/biblioteca', sesion: SESION_ADMIN });
      const medios = await screen.findByRole('list', { name: 'Medios de la biblioteca' });
      const antes = within(medios).getAllByRole('listitem').length;

      const archivo = new File(['x'], 'oso-de-anteojos.jpg', { type: 'image/jpeg' });
      await usuario.upload(screen.getByLabelText('Elegir archivos'), archivo);
      const cola = screen.getByRole('list', { name: 'Archivos por publicar' });
      expect(within(cola).getByLabelText('Descripción')).toHaveValue('oso de anteojos');
      await usuario.selectOptions(within(cola).getByLabelText('Categoría'), 'Fauna');

      await vi.advanceTimersByTimeAsync(3000);
      await usuario.click(screen.getByRole('button', { name: 'Publicar' }));
      expect(within(medios).getAllByRole('listitem')).toHaveLength(antes + 1);
      expect(within(medios).getByRole('button', { name: 'Editar oso de anteojos' })).toBeInTheDocument();
    });
  });

  it('el administrador ve el resumen con NPS y procedencia de los visitantes', async () => {
    renderizarEn({ ruta: '/equipo/admin/resumen', sesion: SESION_ADMIN });
    expect(await screen.findByRole('heading', { name: 'Satisfacción (NPS)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Procedencia de los visitantes' })).toBeInTheDocument();
  });

  it('el guía cierra el tour y consulta su agenda', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/guia', sesion: SESION_GUIA });
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar el tour' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar cierre' }));
    expect(await screen.findByText('Tour cerrado · encuesta enviada')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Agenda' }));
    expect(screen.getByRole('heading', { name: 'Mi agenda' })).toBeInTheDocument();
  });

  it('recupera el acceso sin revelar si el correo existe', async () => {
    const usuario = userEvent.setup();
    renderizarEn({ ruta: '/equipo/acceso' });
    await usuario.click(await screen.findByRole('link', { name: '¿Olvidaste tu contraseña?' }));
    await screen.findByRole('heading', { name: 'Recuperar acceso' });
    await usuario.type(screen.getByLabelText('Correo de trabajo'), 'nadie@ecopalacio.co');
    await usuario.click(screen.getByRole('button', { name: 'Enviarme el enlace' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Si nadie@ecopalacio.co pertenece a una cuenta');
  });
});
