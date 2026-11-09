import type { Dificultad, Sendero } from '@/domain/sendero';
import { claveDeSendero } from '@/domain/sendero';
import { rolDesdeServidor } from '@/domain/equipo';
import { sumarDias } from '@/domain/fechas';
import type {
  CausalReprogramacion,
  EstadoReserva,
  EstadoSolicitud,
  Persona,
  Reserva,
  ReservaDelHistorial,
  TipoDocumento,
  TipoGrupo,
} from '@/domain/reserva';
import { cargarBiblioteca } from '../biblioteca/cargarBiblioteca';
import { ErrorServicio } from '../puertos';
import type { DatosSendero, EventoPanel, ReservaDelPanel, SalidaGuia, SenderoAdmin, Servicios, TourAgenda, Visitante } from '../puertos';
import { crearClienteHttp } from './clienteHttp';
import type { OpcionesCliente } from './clienteHttp';

type NivelApi = 'FACIL' | 'MODERADO' | 'DIFICIL' | 'EXIGENTE';

interface SenderoApi {
  id: number;
  nombre: string;
  nivelDificultad: NivelApi;
  duracionMinutos: number;
  descripcion: string | null;
  requisitosIngreso: string | null;
  precio: number | null;
  activo: boolean;
  publicado: boolean;
  distanciaKm: number | null;
  desnivelM: number | null;
  altitudMaxM: number | null;
  sector: string | null;
  horaSalida: string;
  puntoEncuentro: string | null;
  destacados: string[];
  fotos: string[];
}

interface DiaCalendarioApi {
  fecha: string;
  publicada: boolean;
  reservable: boolean;
  cupoMaximo: number;
  ocupacion: number;
}

interface LoginApi {
  accessToken: string;
  usuario: { email: string; nombreCompleto: string; rol: string };
}

interface PersonaApi {
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  nacionalidad: string;
}

interface MiReservaApi {
  codigo: string;
  senderoId: number;
  senderoNombre: string;
  fecha: string;
  horaSalida: string;
  personas: number;
  titular: PersonaApi & { correo: string; indicativo: string; celular: string };
  acompanantes: PersonaApi[];
  estado: EstadoReserva;
  guia: string | null;
  puntoEncuentro: string | null;
  tipoGrupo: TipoGrupo;
  requerimientosEspeciales: string | null;
  reprogramacion: { causal: CausalReprogramacion; fechaDeseada: string; estado: EstadoSolicitud; motivoDecision: string | null } | null;
}

interface IntegranteApi {
  id: string;
  nombreCompleto: string;
  tipoDocumento: TipoDocumento | null;
  documentoIdentidad: string;
  nacionalidad: string | null;
  asistio: boolean | null;
  visitasPrevias: number;
}

interface ReservaEquipoApi {
  id: string;
  codigoReserva: string;
  senderoId: number;
  guiaId: string | null;
  guiaNombre: string | null;
  fechaTour: string;
  cantidadPersonas: number;
  tipoGrupo: TipoGrupo;
  estado: EstadoReserva;
  titular: (PersonaApi & { correo: string; indicativo: string; celular: string }) | null;
  requerimientosEspeciales: string | null;
  creadaEn: string;
  integrantes: IntegranteApi[] | null;
}

interface CapacidadApi {
  senderoId: number;
  fecha: string;
  cupoMaximo: number;
  umbralAlertaPct: number;
  ocupacion: number;
}

interface GuiaApi {
  id: string;
  email: string;
  nombreCompleto: string;
}

interface ReprogramacionApi {
  id: string;
  codigoReserva: string;
  titular: string | null;
  personas: number;
  causal: CausalReprogramacion;
  descripcion: string;
  fechaOriginal: string;
  fechaDeseada: string;
  estado: EstadoSolicitud;
}

const DIFICULTAD: Record<NivelApi, Dificultad> = {
  FACIL: 'Fácil',
  MODERADO: 'Moderado',
  DIFICIL: 'Difícil',
  EXIGENTE: 'Exigente',
};

const NIVEL: Record<Dificultad, NivelApi> = { Fácil: 'FACIL', Moderado: 'MODERADO', Difícil: 'DIFICIL', Exigente: 'EXIGENTE' };

/** El calendario público da hasta 21 días por consulta (CapacidadService.MAX_DIAS_CALENDARIO). */
const MAX_DIAS_CALENDARIO = 21;
const ESTADOS_DE_SALIDA: readonly EstadoReserva[] = ['CONFIRMADA', 'COMPLETADA'];

const hora = (valor: string | null | undefined) => (valor ?? '07:00').slice(0, 5);

function aSendero(s: SenderoApi, baseUrl: string): SenderoAdmin {
  return {
    id: String(s.id),
    clave: claveDeSendero(s.nombre),
    nombre: s.nombre,
    dificultad: DIFICULTAD[s.nivelDificultad],
    duracionHoras: s.duracionMinutos / 60,
    distanciaKm: s.distanciaKm,
    horaSalida: hora(s.horaSalida),
    sector: s.sector,
    desnivelM: s.desnivelM,
    altitudMaxM: s.altitudMaxM,
    precioPorPersona: s.precio,
    descripcion: s.descripcion ?? '',
    destacados: s.destacados ?? [],
    puntoEncuentro: s.puntoEncuentro,
    requisitosIngreso: s.requisitosIngreso,
    fotos: (s.fotos ?? []).map((f) => baseUrl + f),
    activo: s.activo,
    publicado: s.publicado,
  };
}

const aPersona = (p: PersonaApi): Persona => ({ nombre: p.nombre, tipoDocumento: p.tipoDocumento, documento: p.documento, nacionalidad: p.nacionalidad });

function aReserva(r: MiReservaApi): Reserva {
  return {
    codigo: r.codigo,
    senderoId: String(r.senderoId),
    senderoNombre: r.senderoNombre,
    fecha: r.fecha,
    horaSalida: hora(r.horaSalida),
    personas: r.personas,
    titular: { ...aPersona(r.titular), correo: r.titular.correo, indicativo: r.titular.indicativo, celular: r.titular.celular },
    acompanantes: r.acompanantes.map(aPersona),
    estado: r.estado,
    guia: r.guia,
    puntoEncuentro: r.puntoEncuentro,
    tipoGrupo: r.tipoGrupo,
    requerimientos: r.requerimientosEspeciales,
    reprogramacion: r.reprogramacion
      ? { causal: r.reprogramacion.causal, fechaDeseada: r.reprogramacion.fechaDeseada, estado: r.reprogramacion.estado, motivo: r.reprogramacion.motivoDecision }
      : null,
  };
}

function cuerpoSendero(d: DatosSendero) {
  const texto = (v: string) => (v.trim() === '' ? null : v.trim());
  return JSON.stringify({
    nombre: d.nombre.trim(),
    descripcion: texto(d.descripcion),
    nivelDificultad: NIVEL[d.dificultad],
    duracionMinutos: Math.round(d.duracionHoras * 60),
    tipoExperiencia: 'ECOTURISMO',
    requisitosIngreso: texto(d.requisitosIngreso),
    precio: d.precioPorPersona,
    distanciaKm: d.distanciaKm,
    desnivelM: d.desnivelM,
    altitudMaxM: d.altitudMaxM,
    sector: texto(d.sector),
    horaSalida: d.horaSalida ? `${d.horaSalida}:00` : null,
    puntoEncuentro: texto(d.puntoEncuentro),
    destacados: d.destacados,
  });
}

const enlace = (cabecera: string, token: string) => ({ [cabecera]: token });

function aReservaDelPanel(r: ReservaEquipoApi, sendero: Sendero | undefined): ReservaDelPanel {
  return {
    id: r.id,
    codigo: r.codigoReserva,
    senderoId: String(r.senderoId),
    senderoNombre: sendero?.nombre ?? '',
    fecha: r.fechaTour,
    hora: sendero?.horaSalida ?? '07:00',
    personas: r.cantidadPersonas,
    tipoGrupo: r.tipoGrupo,
    estado: r.estado,
    guiaId: r.guiaId,
    guiaNombre: r.guiaNombre,
    titular: r.titular
      ? { ...aPersona(r.titular), correo: r.titular.correo, celular: [r.titular.indicativo ? `+${r.titular.indicativo}` : '', r.titular.celular ?? ''].join(' ').trim() }
      : null,
    integrantes: (r.integrantes ?? []).map((p) => ({
      nombre: p.nombreCompleto,
      tipoDocumento: p.tipoDocumento ?? 'CC',
      documento: p.documentoIdentidad,
      nacionalidad: p.nacionalidad ?? 'CO',
    })),
    requerimientos: r.requerimientosEspeciales,
    creada: r.creadaEn,
  };
}

/**
 * Adaptador contra la API REST del backend. El indicador de gerencia (resumen del mes) es del
 * Sprint 5 y todavía responde con un error explícito.
 */
export function crearServiciosHttp(opciones: OpcionesCliente): Servicios {
  const { pedir, pedirArchivo, escuchar } = crearClienteHttp(opciones);
  const base = opciones.baseUrl;

  const pendiente = (): never => {
    throw new ErrorServicio('Disponible en el Sprint 5: indicadores de gerencia.', 'noDisponible');
  };

  const senderosPublicos = async () => (await pedir<SenderoApi[]>('/api/v1/senderos')).map((s) => aSendero(s, base));
  const senderosDelEquipo = async () => (await pedir<SenderoApi[]>('/api/v1/senderos/admin')).map((s) => aSendero(s, base));
  const porId = (lista: Sendero[]) => new Map(lista.map((s) => [s.id, s]));

  const miReserva = async (token: string) =>
    aReserva(await pedir<MiReservaApi>('/api/v1/mi-reserva', { headers: enlace('X-Enlace-Reserva', token) }));

  const reservasDelGuia = async (fecha?: string) =>
    pedir<ReservaEquipoApi[]>(`/api/v1/reservas/agenda-guia${fecha ? `?fecha=${fecha}` : ''}`);

  // Una sola conexión de eventos por pestaña, compartida por todo lo que la escucha (la campana y el panel de hoy).
  const oyentesPanel = new Set<(e: EventoPanel) => void>();
  let cortarEventos: (() => void) | null = null;
  const escucharPanel = (alEvento: (e: EventoPanel) => void) => {
    oyentesPanel.add(alEvento);
    cortarEventos ??= escuchar('/api/v1/panel/eventos', (nombre, datos) => {
      if (nombre !== 'reserva' && nombre !== 'aforo') return;
      const evento = { tipo: nombre, ...JSON.parse(datos) } as EventoPanel;
      oyentesPanel.forEach((oyente) => oyente(evento));
    });
    return () => {
      oyentesPanel.delete(alEvento);
      if (oyentesPanel.size === 0) {
        cortarEventos?.();
        cortarEventos = null;
      }
    };
  };

  return {
    senderos: {
      listar: senderosPublicos,
      obtener: async (id) => aSendero(await pedir<SenderoApi>(`/api/v1/senderos/${encodeURIComponent(id)}`), base),
      disponibilidad: async (id, desde, dias) => {
        const dia = await pedir<DiaCalendarioApi[]>(
          `/api/v1/senderos/${encodeURIComponent(id)}/calendario?desde=${desde}&dias=${Math.min(dias, MAX_DIAS_CALENDARIO)}`,
        );
        // Un día sin capacidad publicada o fuera de la ventana de reserva no se ofrece; uno publicado y lleno sí se ve lleno.
        return dia.map((d) => (d.reservable || (d.publicada && d.ocupacion >= d.cupoMaximo)
          ? { fecha: d.fecha, limite: d.cupoMaximo, ocupados: d.ocupacion }
          : { fecha: d.fecha, limite: 0, ocupados: 0, cerrada: true }));
      },
    },

    catalogo: {
      listar: senderosDelEquipo,
      guardar: async (datos, id) =>
        aSendero(
          await pedir<SenderoApi>(id ? `/api/v1/senderos/${id}` : '/api/v1/senderos', { method: id ? 'PUT' : 'POST', body: cuerpoSendero(datos) }),
          base,
        ),
      publicar: async (id, publicado) =>
        aSendero(await pedir<SenderoApi>(`/api/v1/senderos/${id}/publicacion?publicado=${publicado}`, { method: 'POST' }), base),
      darDeBaja: async (id, confirmar) => {
        await pedir<void>(`/api/v1/senderos/${id}?confirmar=${confirmar}`, { method: 'DELETE' });
      },
      subirFoto: async (id, archivo) => {
        const datos = new FormData();
        datos.append('foto', archivo);
        return aSendero(await pedir<SenderoApi>(`/api/v1/senderos/${id}/fotos`, { method: 'POST', body: datos }), base);
      },
      borrarFoto: async (id, url) =>
        aSendero(await pedir<SenderoApi>(`/api/v1/senderos/${id}/fotos/${url.split('/').pop()}`, { method: 'DELETE' }), base),
    },

    reservas: {
      crear: async (s) => {
        const r = await pedir<{ codigoReserva: string; estado: EstadoReserva }>('/api/v1/reservas/sin-cuenta', {
          method: 'POST',
          body: JSON.stringify({
            senderoId: Number(s.senderoId),
            fechaTour: s.fecha,
            personas: s.personas,
            titular: s.titular,
            acompanantes: [],
            tipoGrupo: s.tipoGrupo,
            requerimientosEspeciales: s.requerimientos.trim() || null,
          }),
        });
        return { codigo: r.codigoReserva, estado: r.estado };
      },
      abrirConEnlace: miReserva,
      solicitarEnlace: async (codigo, correo) => {
        await pedir<void>('/api/v1/mi-reserva/enlace', { method: 'POST', body: JSON.stringify({ codigo: codigo.trim(), correo: correo.trim() }) });
      },
      agregarAcompanante: async (token, persona) =>
        aReserva(await pedir<MiReservaApi>('/api/v1/mi-reserva/acompanantes', {
          method: 'POST',
          headers: enlace('X-Enlace-Reserva', token),
          body: JSON.stringify(persona),
        })),
      solicitarReprogramacion: async (token, s) => {
        const datos = new FormData();
        datos.append('causal', s.causal);
        datos.append('descripcion', s.descripcion.trim());
        datos.append('fechaDeseada', s.fechaDeseada);
        datos.append('soporte', s.soporte);
        await pedir<void>('/api/v1/mi-reserva/reprogramacion', { method: 'POST', headers: enlace('X-Enlace-Reserva', token), body: datos });
        return miReserva(token);
      },
      solicitarHistorial: async (correo) => {
        await pedir<void>('/api/v1/mis-reservas/enlace', { method: 'POST', body: JSON.stringify({ correo: correo.trim() }) });
      },
      iniciarPago: async (token) =>
        (await pedir<{ url: string }>('/api/v1/mi-reserva/pago', { method: 'POST', headers: enlace('X-Enlace-Reserva', token) })).url,
      historial: async (token) =>
        (await pedir<(Omit<ReservaDelHistorial, 'senderoId'> & { senderoId: number })[]>('/api/v1/mis-reservas', {
          headers: enlace('X-Enlace-Historial', token),
        })).map((r) => ({ ...r, senderoId: String(r.senderoId) })),
    },

    operacion: {
      enRevision: async () => {
        const [reservas, senderos] = await Promise.all([pedir<ReservaEquipoApi[]>('/api/v1/reservas/en-revision'), senderosDelEquipo()]);
        const nombres = porId(senderos);
        return reservas.map((r) => ({
          id: r.id,
          codigo: r.codigoReserva,
          titular: r.titular?.nombre ?? '—',
          motivo: r.requerimientosEspeciales ?? '',
          senderoNombre: nombres.get(String(r.senderoId))?.nombre ?? '',
          fecha: r.fechaTour,
          personas: r.cantidadPersonas,
          tipoGrupo: r.tipoGrupo,
        }));
      },
      resolverRevision: async (id, aprobar, motivo) => {
        await pedir<void>(`/api/v1/reservas/${id}/revision`, { method: 'POST', body: JSON.stringify({ aprobar, motivo: motivo ?? null }) });
      },
      reprogramaciones: async () =>
        (await pedir<ReprogramacionApi[]>('/api/v1/reprogramaciones')).map((r) => ({
          id: r.id,
          codigo: r.codigoReserva,
          titular: r.titular ?? '—',
          personas: r.personas,
          causal: r.causal,
          descripcion: r.descripcion,
          fechaOriginal: r.fechaOriginal,
          fechaDeseada: r.fechaDeseada,
          estado: r.estado,
        })),
      soporteReprogramacion: (id) => pedirArchivo(`/api/v1/reprogramaciones/${id}/soporte`),
      decidirReprogramacion: async (id, aprobar, motivo) => {
        await pedir<void>(`/api/v1/reprogramaciones/${id}/decision`, { method: 'POST', body: JSON.stringify({ aprobar, motivo: motivo ?? null }) });
      },
      salidasDelDia: async (fecha) => {
        const [reservas, senderos] = await Promise.all([
          pedir<ReservaEquipoApi[]>(`/api/v1/reservas?desde=${fecha}&hasta=${fecha}&estado=CONFIRMADA`),
          senderosDelEquipo(),
        ]);
        const nombres = porId(senderos);
        const grupos = new Map<number, ReservaEquipoApi[]>();
        reservas.forEach((r) => grupos.set(r.senderoId, [...(grupos.get(r.senderoId) ?? []), r]));
        return [...grupos.entries()]
          .map(([senderoId, rs]) => {
            const s = nombres.get(String(senderoId));
            const guias = [...new Set(rs.map((r) => r.guiaNombre))];
            return {
              hora: s?.horaSalida ?? '07:00',
              senderoNombre: s?.nombre ?? '',
              personas: rs.reduce((t, r) => t + r.cantidadPersonas, 0),
              guia: guias.includes(null) ? null : guias.join(', '),
            };
          })
          .sort((a, b) => a.hora.localeCompare(b.hora));
      },
      reservasDelPeriodo: async (desde, hasta) => {
        const [reservas, senderos] = await Promise.all([
          pedir<ReservaEquipoApi[]>(`/api/v1/reservas?desde=${desde}&hasta=${hasta}`),
          senderosDelEquipo(),
        ]);
        const nombres = porId(senderos);
        return reservas.map((r) => aReservaDelPanel(r, nombres.get(String(r.senderoId))));
      },
      guias: async () =>
        (await pedir<GuiaApi[]>('/api/v1/usuarios/guias')).map((g) => ({ id: g.id, nombre: g.nombreCompleto, correo: g.email })),
      asignarGuia: async (reservaId, guiaId) => {
        await pedir<void>(`/api/v1/reservas/${reservaId}/asignar-guia`, { method: 'POST', body: JSON.stringify({ guiaId }) });
      },
      capacidad: async (desde, hasta) =>
        (await pedir<CapacidadApi[]>(`/api/v1/capacidad?desde=${desde}&hasta=${hasta}`)).map((d) => ({
          senderoId: String(d.senderoId),
          fecha: d.fecha,
          cupoMaximo: d.cupoMaximo,
          umbralPct: d.umbralAlertaPct,
          ocupacion: d.ocupacion,
        })),
      cargarCapacidad: async (senderoId, dias) => {
        await pedir<void>(`/api/v1/senderos/${senderoId}/capacidad`, {
          method: 'PUT',
          body: JSON.stringify({ dias: dias.map((d) => ({ fecha: d.fecha, cupoMaximo: d.cupoMaximo, umbralAlertaPct: d.umbralPct })) }),
        });
      },
      ocupacion: async (fecha) => {
        const [dias, senderos] = await Promise.all([
          pedir<CapacidadApi[]>(`/api/v1/capacidad?desde=${fecha}&hasta=${fecha}`),
          senderosDelEquipo(),
        ]);
        const nombres = porId(senderos);
        return dias
          .map((d) => ({ senderoNombre: nombres.get(String(d.senderoId))?.nombre ?? '', ocupados: d.ocupacion, limite: d.cupoMaximo, umbralPct: d.umbralAlertaPct }))
          .sort((a, b) => b.ocupados / b.limite - a.ocupados / a.limite);
      },
      salidaDelGuia: async (fecha) => {
        const [reservas, senderos] = await Promise.all([reservasDelGuia(fecha), senderosPublicos()]);
        const delDia = reservas.filter((r) => ESTADOS_DE_SALIDA.includes(r.estado));
        if (delDia.length === 0) return null;
        const nombres = porId(senderos);
        // El guía sale con un sendero por jornada; si tuviera dos, se muestra el de salida más temprana.
        const primero = [...delDia].sort((a, b) =>
          (nombres.get(String(a.senderoId))?.horaSalida ?? '').localeCompare(nombres.get(String(b.senderoId))?.horaSalida ?? ''))[0];
        const salida = delDia.filter((r) => r.senderoId === primero.senderoId);
        const sendero = nombres.get(String(primero.senderoId));
        const listas = await Promise.all(salida.map((r) => pedir<IntegranteApi[]>(`/api/v1/reservas/${r.id}/turistas`)));
        const visitantes: Visitante[] = salida.flatMap((r, i) =>
          listas[i].map((p) => ({
            id: p.id,
            reservaId: r.id,
            nombre: p.nombreCompleto,
            nota: r.titular && p.documentoIdentidad === r.titular.documento ? `Titular · ${r.codigoReserva}` : `Acompañante · ${r.codigoReserva}`,
            pais: p.nacionalidad ?? 'CO',
            visitasPrevias: p.visitasPrevias,
            presente: p.asistio ?? false,
          })),
        );
        const total = salida.reduce((t, r) => t + r.cantidadPersonas, 0);
        const resultado: SalidaGuia = {
          senderoNombre: sendero?.nombre ?? '',
          hora: sendero?.horaSalida ?? '07:00',
          total,
          reservaIds: salida.map((r) => r.id),
          requerimientos: salida
            .filter((r) => r.requerimientosEspeciales)
            .map((r) => ({ codigo: r.codigoReserva, texto: r.requerimientosEspeciales as string })),
          visitantes,
          sinRegistrar: Math.max(0, total - visitantes.length),
          cerrada: salida.every((r) => r.estado === 'COMPLETADA'),
        };
        return resultado;
      },
      marcarAsistencia: async (v, presente) => {
        await pedir<void>(`/api/v1/reservas/${v.reservaId}/integrantes/${v.id}/asistencia`, {
          method: 'PUT',
          body: JSON.stringify({ asistio: presente }),
        });
      },
      cerrarSalida: async (reservaIds) => {
        for (const id of reservaIds) await pedir<void>(`/api/v1/reservas/${id}/asistencia`, { method: 'POST' });
      },
      agendaGuia: async (desde, dias) => {
        const [reservas, senderos] = await Promise.all([reservasDelGuia(), senderosPublicos()]);
        const hasta = sumarDias(desde, dias - 1);
        const nombres = porId(senderos);
        const tours = new Map<string, TourAgenda>();
        reservas
          .filter((r) => r.estado === 'CONFIRMADA' && r.fechaTour >= desde && r.fechaTour <= hasta)
          .forEach((r) => {
            const s = nombres.get(String(r.senderoId));
            const clave = `${r.fechaTour}|${r.senderoId}`;
            const actual = tours.get(clave);
            tours.set(clave, {
              fecha: r.fechaTour,
              hora: s?.horaSalida ?? '07:00',
              senderoNombre: s?.nombre ?? '',
              personas: (actual?.personas ?? 0) + r.cantidadPersonas,
              puntoEncuentro: s?.puntoEncuentro ?? null,
            });
          });
        return [...tours.values()].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
      },
      escucharEventos: escucharPanel,
      resumenGerencia: async () => pendiente(),
    },

    biblioteca: { listar: cargarBiblioteca },
    autenticacion: {
      iniciarSesion: async (correo, clave) => {
        const r = await pedir<LoginApi>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: correo, password: clave }),
        });
        const rol = rolDesdeServidor(r.usuario.rol);
        if (!rol) throw new ErrorServicio('Esta cuenta no pertenece al equipo.', 'cuentaNoEquipo');
        return { nombre: r.usuario.nombreCompleto, correo: r.usuario.email, rol, token: r.accessToken };
      },
      cerrarSesion: async () => {
        await pedir<void>('/api/v1/auth/logout', { method: 'POST' });
      },
      solicitarRecuperacion: async (correo) => {
        await pedir<void>('/api/v1/auth/olvide-password', {
          method: 'POST',
          body: JSON.stringify({ email: correo.trim() }),
        });
      },
      restablecerClave: async (token, nueva) => {
        try {
          await pedir<void>('/api/v1/auth/restablecer-password', {
            method: 'POST',
            body: JSON.stringify({ token, nuevaPassword: nueva }),
          });
        } catch (e) {
          // La clave ya se validó en el formulario: un 400 aquí es un enlace vencido, usado o desconocido.
          if (e instanceof ErrorServicio && e.codigo === 'datosInvalidos') {
            throw new ErrorServicio(e.message, 'enlaceRecuperacionVencido');
          }
          throw e;
        }
      },
    },
  };
}
