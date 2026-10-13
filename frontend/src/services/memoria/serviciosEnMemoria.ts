import type { Disponibilidad } from '@/domain/aforo';
import { cuposLibres } from '@/domain/aforo';
import type { Persona, Reserva } from '@/domain/reserva';
import { validarSolicitud } from '@/domain/reserva';
import { sumarDias } from '@/domain/fechas';
import { ErrorServicio } from '../puertos';
import type {
  OcupacionSendero,
  ReservaEnRevision,
  Servicios,
  Visitante,
} from '../puertos';
import { CLAVE_DEMO, CUENTAS_DEMO, SENDEROS } from './datos';

interface Opciones {
  /** Latencia simulada para ver estados de carga; 0 en pruebas. */
  latenciaMs?: number;
}

/** Límite y ocupación deterministas por sendero y fecha, para que la demo sea estable. */
function aforoBase(senderoId: string, fecha: string): Disponibilidad {
  let h = 0;
  for (const c of senderoId + fecha) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const limite = 20 + (h % 4) * 5;
  const lleno = h % 7 === 0;
  const ocupados = lleno ? limite : Math.floor(((h >>> 3) % 100) / 100 * limite * 0.95);
  return { fecha, limite, ocupados };
}

function token(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

function codigoReserva(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const v = crypto.getRandomValues(new Uint8Array(4));
  return 'NT-' + Array.from(v, (b) => alfabeto[b % alfabeto.length]).join('');
}

export function crearServiciosEnMemoria({ latenciaMs = 250 }: Opciones = {}): Servicios {
  const esperar = <T,>(valor: T): Promise<T> =>
    latenciaMs > 0 ? new Promise((r) => setTimeout(() => r(valor), latenciaMs)) : Promise.resolve(valor);

  const reservas = new Map<string, Reserva>();
  const enlaces = new Map<string, string>();
  const ocupacionExtra = new Map<string, number>();

  const revision: ReservaEnRevision[] = [
    { codigo: 'NT-7Q4K', titular: 'Laura Gómez', motivo: 'Falta documento de 1 acompañante', senderoNombre: 'Lagunas de Siecha', fecha: '16/10' },
    { codigo: 'NT-3MZ8', titular: 'Colegio Los Andes', motivo: 'Grupo de 18 · requiere 2 guías', senderoNombre: 'Bosque de Niebla', fecha: '17/10' },
    { codigo: 'NT-9B2T', titular: 'Camilo Herrera', motivo: 'Menor de edad en el grupo', senderoNombre: 'Chorreras', fecha: '18/10' },
  ];

  const visitantes: Visitante[] = [
    ['Laura Gómez', 'Titular · NT-7Q4K'], ['Diego Gómez', 'Acompañante'], ['Sara Molina', 'Titular · NT-5HC1'],
    ['Tomás Molina', '12 años'], ['Valentina Ríos', 'Titular · NT-8LP0'], ['Felipe Ortiz', 'Asma · lleva inhalador'],
    ['Natalia Ortiz', 'Acompañante'], ['Juan Pablo Díaz', 'Titular · NT-2RX7'],
  ].map(([nombre, nota], i) => ({ id: `v${i}`, nombre, nota, presente: i < 2 }));

  const disponibilidad = (id: string, fecha: string): Disponibilidad => {
    const base = aforoBase(id, fecha);
    return { ...base, ocupados: Math.min(base.limite, base.ocupados + (ocupacionExtra.get(`${id}|${fecha}`) ?? 0)) };
  };

  const buscarSendero = (id: string) => {
    const s = SENDEROS.find((x) => x.id === id);
    if (!s) throw new ErrorServicio('Ese sendero no existe.');
    return s;
  };

  const reservaPorToken = (t: string): Reserva => {
    const codigo = enlaces.get(t);
    const r = codigo ? reservas.get(codigo) : undefined;
    if (!r) throw new ErrorServicio('El enlace no es válido o ya caducó. Pide uno nuevo con tu código y tu correo.');
    return r;
  };

  return {
    senderos: {
      listar: () => esperar([...SENDEROS]),
      obtener: async (id) => esperar(buscarSendero(id)),
      disponibilidad: async (id, desde, dias) => {
        buscarSendero(id);
        return esperar(Array.from({ length: dias }, (_, i) => disponibilidad(id, sumarDias(desde, i))));
      },
    },

    reservas: {
      crear: async (s) => {
        const errores = validarSolicitud(s);
        if (errores.length > 0) throw new ErrorServicio(errores[0]);
        const sendero = buscarSendero(s.senderoId);
        const d = disponibilidad(s.senderoId, s.fecha);
        if (s.personas > cuposLibres(d)) throw new ErrorServicio('Ya no quedan cupos suficientes para esa fecha.');
        const codigo = codigoReserva();
        reservas.set(codigo, {
          codigo, senderoId: sendero.id, senderoNombre: sendero.nombre, fecha: s.fecha, horaSalida: sendero.horaSalida,
          personas: s.personas, titular: s.titular, acompanantes: [], estado: 'PENDIENTE_PAGO', guia: null, puntoEncuentro: sendero.puntoEncuentro,
        });
        const clave = `${s.senderoId}|${s.fecha}`;
        ocupacionExtra.set(clave, (ocupacionExtra.get(clave) ?? 0) + s.personas);
        const t = token();
        enlaces.set(t, codigo);
        return esperar({ codigo, enlaceDesarrollo: `/mi-reserva/${t}` });
      },
      abrirConEnlace: async (t) => esperar(structuredClone(reservaPorToken(t))),
      solicitarEnlace: async () => esperar(undefined),
      agregarAcompanante: async (t, persona: Persona) => {
        const r = reservaPorToken(t);
        if (r.acompanantes.length >= r.personas - 1) throw new ErrorServicio('Ya registraste a todos los acompañantes.');
        if (persona.nombre.trim().length < 3 || !/^\d{5,12}$/.test(persona.documento.trim())) {
          throw new ErrorServicio('Revisa el nombre y el documento del acompañante.');
        }
        r.acompanantes.push({ nombre: persona.nombre.trim(), documento: persona.documento.trim() });
        return esperar(structuredClone(r));
      },
      cancelar: async (t) => {
        const r = reservaPorToken(t);
        r.estado = 'CANCELADA';
        const clave = `${r.senderoId}|${r.fecha}`;
        ocupacionExtra.set(clave, Math.max(0, (ocupacionExtra.get(clave) ?? 0) - r.personas));
        return esperar(structuredClone(r));
      },
    },

    operacion: {
      enRevision: () => esperar(revision.map((r) => ({ ...r }))),
      resolverRevision: async (codigo) => {
        const i = revision.findIndex((r) => r.codigo === codigo);
        if (i === -1) throw new ErrorServicio('Esa reserva ya no está en revisión.');
        revision.splice(i, 1);
        return esperar(undefined);
      },
      salidasDelDia: () => esperar([
        { hora: '06:30', senderoNombre: 'Chorreras', personas: 12, guia: 'Julián P.' },
        { hora: '07:00', senderoNombre: 'Lagunas de Siecha', personas: 16, guia: 'Marta L.' },
        { hora: '08:00', senderoNombre: 'Bosque de Niebla', personas: 11, guia: null },
        { hora: '09:30', senderoNombre: 'La Paila', personas: 8, guia: 'Andrés C.' },
      ]),
      ocupacion: (fecha) => esperar(
        ['lagunas-de-siecha', 'chorreras', 'bosque-de-niebla', 'suasie', 'la-paila'].map((id): OcupacionSendero => {
          const d = disponibilidad(id, fecha);
          return { senderoNombre: buscarSendero(id).nombre, ocupados: d.ocupados, limite: d.limite };
        }),
      ),
      salidaDelGuia: () => esperar({
        senderoNombre: 'Lagunas de Siecha', hora: '07:00', total: 16, visitantes: visitantes.map((v) => ({ ...v })),
      }),
      marcarAsistencia: async (id, presente) => {
        const v = visitantes.find((x) => x.id === id);
        if (v) v.presente = presente;
        return esperar(undefined);
      },
      resumenGerencia: () => esperar({
        ocupacionPromedioPct: 68, visitantes: 1284, reservas: 412, cancelacionesPct: 6,
        ocupacionDiariaPct: [42, 38, 55, 61, 88, 97, 74, 40, 36, 52, 58, 85, 96, 70, 44, 41, 57, 63, 90, 98, 76, 39, 35, 50, 60, 87, 95, 72, 46, 43, 59],
        ranking: [
          { senderoNombre: 'Lagunas de Siecha', visitantes: 312, ocupacionPct: 82 },
          { senderoNombre: 'Chorreras', visitantes: 240, ocupacionPct: 91 },
          { senderoNombre: 'Bosque de Niebla', visitantes: 198, ocupacionPct: 66 },
          { senderoNombre: 'Suasie', visitantes: 141, ocupacionPct: 47 },
          { senderoNombre: 'La Paila', visitantes: 120, ocupacionPct: 34 },
        ],
      }),
    },

    autenticacion: {
      iniciarSesion: async (correo, clave) => {
        const cuenta = CUENTAS_DEMO.find((c) => c.correo === correo.trim().toLowerCase());
        if (!cuenta || clave !== CLAVE_DEMO) throw new ErrorServicio('Correo o contraseña incorrectos.');
        return esperar({ nombre: cuenta.nombre, correo: cuenta.correo, rol: cuenta.rol, token: token() });
      },
    },
  };
}
