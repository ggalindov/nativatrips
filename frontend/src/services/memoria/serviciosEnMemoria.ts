import type { Disponibilidad } from '@/domain/aforo';
import { cuposLibres } from '@/domain/aforo';
import type { EstadoReserva, Persona, Reserva, ReservaDelHistorial } from '@/domain/reserva';
import { SOPORTE_MAXIMO_BYTES, requiereRevision, validarPersona, validarSolicitud } from '@/domain/reserva';
import type { Sendero } from '@/domain/sendero';
import { claveDeSendero } from '@/domain/sendero';
import { LARGO_MINIMO_CLAVE } from '@/domain/equipo';
import { hoyIso, sumarDias } from '@/domain/fechas';
import { cargarBiblioteca } from '../biblioteca/cargarBiblioteca';
import { ErrorServicio } from '../puertos';
import type {
  CapacidadDia,
  EventoPanel,
  GuiaEquipo,
  OcupacionSendero,
  ReservaDelPanel,
  ReprogramacionEnRevision,
  ReservaEnRevision,
  SenderoAdmin,
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
  const v = crypto.getRandomValues(new Uint8Array(6));
  return 'NT-' + Array.from(v, (b) => alfabeto[b % alfabeto.length]).join('');
}

export function crearServiciosEnMemoria({ latenciaMs = 250 }: Opciones = {}): Servicios {
  const esperar = <T,>(valor: T): Promise<T> =>
    latenciaMs > 0 ? new Promise((r) => setTimeout(() => r(valor), latenciaMs)) : Promise.resolve(valor);

  const reservas = new Map<string, Reserva>();
  const enlaces = new Map<string, string>();
  const historiales = new Map<string, string>();
  const ocupacionExtra = new Map<string, number>();
  const suscriptores = new Set<(e: EventoPanel) => void>();
  const catalogo: SenderoAdmin[] = SENDEROS.map((s) => ({ ...s, activo: true, publicado: true }));

  const revision: ReservaEnRevision[] = [
    { id: 'r1', codigo: 'NT-7Q4KX2', titular: 'Colegio Los Andes', motivo: 'Grupo de 18 estudiantes y 2 docentes', senderoNombre: 'Bosque de Niebla', fecha: sumarDias(hoyIso(), 4), personas: 20, tipoGrupo: 'GRUPO_CORPORATIVO' },
    { id: 'r2', codigo: 'NT-3MZ8PA', titular: 'Camilo Herrera', motivo: 'Una persona en silla de ruedas', senderoNombre: 'La Paila', fecha: sumarDias(hoyIso(), 5), personas: 4, tipoGrupo: 'NECESIDAD_ESPECIAL' },
  ];

  const reprogramaciones: ReprogramacionEnRevision[] = [
    { id: 'p1', codigo: 'NT-9B2TQR', titular: 'Sara Molina', personas: 2, causal: 'INCAPACIDAD_MEDICA', descripcion: 'Incapacidad de cinco días por bronquitis', fechaOriginal: sumarDias(hoyIso(), 2), fechaDeseada: sumarDias(hoyIso(), 12), estado: 'PENDIENTE' },
  ];

  const visitantes: Visitante[] = [
    ['Laura Gómez', 'Titular · NT-7Q4KX2', 'CO', 2], ['Diego Gómez', 'Acompañante · NT-7Q4KX2', 'CO', 0], ['Sara Molina', 'Titular · NT-5HC1MA', 'CO', 1],
    ['Tomás Molina', 'Acompañante · NT-5HC1MA', 'CO', 0], ['Valentina Ríos', 'Titular · NT-8LP0WE', 'CO', 3], ['Felipe Ortiz', 'Titular · NT-2RX7KD', 'US', 0],
    ['Natalia Ortiz', 'Acompañante · NT-2RX7KD', 'US', 0], ['Juan Pablo Díaz', 'Titular · NT-6TT3BN', 'FR', 1],
  ].map(([nombre, nota, pais, visitas], i) => ({
    id: `v${i}`, reservaId: `rs${i}`, nombre: String(nombre), nota: String(nota), pais: String(pais), visitasPrevias: Number(visitas), presente: i < 2,
  }));
  let salidaCerrada = false;

  const guias: GuiaEquipo[] = [
    { id: 'g1', nombre: 'Marta León', correo: 'guia@ecopalacio.co' },
    { id: 'g2', nombre: 'Julián Pardo', correo: 'julian@ecopalacio.co' },
  ];
  /** Capacidad que el administrador cargó en esta sesión; el resto sale de aforoBase. */
  const capacidadCargada = new Map<string, { cupoMaximo: number; umbralPct: number }>();
  /** Reservas de demostración del panel, más las que se crean en la sesión. */
  const panel: ReservaDelPanel[] = [
    ['p1', 'NT-5HC1MA', 'lagunas-de-siecha', 1, 2, 'CONFIRMADA', 'g1', 'Sara Molina', 'FR'],
    ['p2', 'NT-8LP0WE', 'lagunas-de-siecha', 1, 3, 'CONFIRMADA', null, 'Valentina Ríos', 'CO'],
    ['p3', 'NT-K4W9ZT', 'suasie', 3, 2, 'PENDIENTE_PAGO', null, 'Lucas Ferreira', 'BR'],
    ['p4', 'NT-7Q4KX2', 'bosque-de-niebla', 4, 20, 'EN_REVISION', null, 'Colegio Los Andes', 'CO'],
    ['p5', 'NT-Q9D5HU', 'laguna-seca', -5, 3, 'COMPLETADA', 'g2', 'Pedro Sánchez', 'CO'],
  ].map(([id, codigo, senderoId, dias, personas, estado, guiaId, nombre, pais]) => {
    const sendero = SENDEROS.find((x) => x.id === senderoId) ?? SENDEROS[0];
    const titular = { nombre: String(nombre), tipoDocumento: 'CC' as const, documento: `10${String(id).slice(1)}2030`, nacionalidad: String(pais) };
    return {
      id: String(id), codigo: String(codigo), senderoId: sendero.id, senderoNombre: sendero.nombre, fecha: sumarDias(hoyIso(), Number(dias)),
      hora: sendero.horaSalida, personas: Number(personas), tipoGrupo: Number(personas) > 12 ? 'GRUPO_CORPORATIVO' : 'ESTANDAR', estado: estado as EstadoReserva,
      guiaId: guiaId as string | null, guiaNombre: guias.find((g) => g.id === guiaId)?.nombre ?? null,
      titular: { ...titular, correo: `${String(codigo).toLowerCase()}@correo.co`, celular: '+57 300 123 4567' },
      integrantes: [titular], requerimientos: null, creada: new Date().toISOString(),
    };
  });

  const disponibilidad = (id: string, fecha: string): Disponibilidad => {
    const cargada = capacidadCargada.get(`${id}|${fecha}`);
    const base = cargada ? { ...aforoBase(id, fecha), limite: cargada.cupoMaximo } : aforoBase(id, fecha);
    return { ...base, ocupados: Math.min(base.limite, base.ocupados + (ocupacionExtra.get(`${id}|${fecha}`) ?? 0)) };
  };

  const buscarSendero = (id: string): SenderoAdmin => {
    const s = catalogo.find((x) => x.id === id);
    if (!s) throw new ErrorServicio('Ese sendero no existe.', 'senderoInexistente');
    return s;
  };

  const publico = (s: SenderoAdmin): Sendero => {
    const { activo: _activo, publicado: _publicado, ...sendero } = s;
    return sendero;
  };

  const reservaPorToken = (t: string): Reserva => {
    const codigo = enlaces.get(t);
    const r = codigo ? reservas.get(codigo) : undefined;
    if (!r) throw new ErrorServicio('El enlace no es válido o ya caducó.', 'enlaceInvalido');
    return r;
  };

  const emitir = (e: EventoPanel) => suscriptores.forEach((alEvento) => alEvento(e));

  return {
    senderos: {
      listar: () => esperar(catalogo.filter((s) => s.activo && s.publicado).map(publico)),
      obtener: async (id) => {
        const s = buscarSendero(id);
        if (!s.activo || !s.publicado) throw new ErrorServicio('Ese sendero no existe.', 'senderoInexistente');
        return esperar(publico(s));
      },
      disponibilidad: async (id, desde, dias) => {
        buscarSendero(id);
        return esperar(Array.from({ length: dias }, (_, i) => disponibilidad(id, sumarDias(desde, i))));
      },
    },

    catalogo: {
      listar: () => esperar(catalogo.map((s) => ({ ...s }))),
      guardar: async (datos, id) => {
        const campos = { ...datos, sector: datos.sector || null, puntoEncuentro: datos.puntoEncuentro || null, requisitosIngreso: datos.requisitosIngreso || null };
        if (id) {
          const s = buscarSendero(id);
          Object.assign(s, campos);
          return esperar({ ...s });
        }
        const nuevo: SenderoAdmin = { ...campos, id: `s${catalogo.length + 1}`, clave: claveDeSendero(datos.nombre), fotos: [], activo: true, publicado: false };
        catalogo.unshift(nuevo);
        return esperar({ ...nuevo });
      },
      publicar: async (id, publicado) => {
        const s = buscarSendero(id);
        if (publicado && (!s.descripcion.trim() || !s.requisitosIngreso?.trim())) {
          throw new ErrorServicio('Para publicar completa la descripción y los requisitos de ingreso.', 'datosInvalidos');
        }
        s.publicado = publicado;
        if (publicado) s.activo = true;
        return esperar({ ...s });
      },
      darDeBaja: async (id, confirmar) => {
        const s = buscarSendero(id);
        const futuras = [...reservas.values()].filter((r) => r.senderoId === id && r.fecha >= hoyIso() && r.estado !== 'CANCELADA').length;
        if (futuras > 0 && !confirmar) {
          throw new ErrorServicio(`El sendero tiene ${futuras} reserva(s) desde hoy.`, 'reservasFuturas', { reservasFuturas: futuras });
        }
        s.activo = false;
        return esperar(undefined);
      },
      subirFoto: async (id, archivo) => {
        const s = buscarSendero(id);
        if (!archivo.type.startsWith('image/')) throw new ErrorServicio('Ese tipo de archivo no se acepta.', 'archivoNoPermitido');
        s.fotos = [...s.fotos, URL.createObjectURL(archivo)];
        return esperar({ ...s });
      },
      borrarFoto: async (id, url) => {
        const s = buscarSendero(id);
        s.fotos = s.fotos.filter((f) => f !== url);
        return esperar({ ...s });
      },
    },

    reservas: {
      crear: async (s) => {
        const errores = validarSolicitud(s);
        if (errores.length > 0) throw new ErrorServicio(`Solicitud inválida: ${errores.join(', ')}`, 'datosInvalidos');
        const sendero = buscarSendero(s.senderoId);
        const d = disponibilidad(s.senderoId, s.fecha);
        if (s.personas > cuposLibres(d)) throw new ErrorServicio('Ya no quedan cupos suficientes para esa fecha.', 'sinCupos');
        const codigo = codigoReserva();
        const estado = requiereRevision(s.tipoGrupo) ? 'EN_REVISION' : 'PENDIENTE_PAGO';
        reservas.set(codigo, {
          codigo, senderoId: sendero.id, senderoNombre: sendero.nombre, fecha: s.fecha, horaSalida: sendero.horaSalida,
          personas: s.personas, titular: s.titular, acompanantes: [], estado, guia: null, puntoEncuentro: sendero.puntoEncuentro,
          tipoGrupo: s.tipoGrupo, requerimientos: s.requerimientos.trim() || null, reprogramacion: null,
        });
        const clave = `${s.senderoId}|${s.fecha}`;
        ocupacionExtra.set(clave, (ocupacionExtra.get(clave) ?? 0) + s.personas);
        const t = token();
        enlaces.set(t, codigo);
        panel.push({
          id: codigo, codigo, senderoId: sendero.id, senderoNombre: sendero.nombre, fecha: s.fecha, hora: sendero.horaSalida, personas: s.personas,
          tipoGrupo: s.tipoGrupo, estado, guiaId: null, guiaNombre: null, titular: s.titular, integrantes: [s.titular],
          requerimientos: s.requerimientos.trim() || null, creada: new Date().toISOString(),
        });
        emitir({ tipo: 'reserva', codigo, estado, senderoNombre: sendero.nombre, fecha: s.fecha, personas: s.personas, tipoGrupo: s.tipoGrupo, titular: s.titular.nombre });
        return esperar({ codigo, estado, enlaceDesarrollo: `/mi-reserva/${t}` });
      },
      abrirConEnlace: async (t) => esperar(structuredClone(reservaPorToken(t))),
      solicitarEnlace: async () => esperar(undefined),
      agregarAcompanante: async (t, persona: Persona) => {
        const r = reservaPorToken(t);
        if (r.acompanantes.length >= r.personas - 1) throw new ErrorServicio('Ya registraste a todos los acompañantes.', 'acompanantesCompletos');
        if (validarPersona(persona).length > 0) throw new ErrorServicio('Revisa los datos del acompañante.', 'acompananteInvalido');
        r.acompanantes.push({ ...persona, nombre: persona.nombre.trim(), documento: persona.documento.trim().toUpperCase() });
        return esperar(structuredClone(r));
      },
      solicitarReprogramacion: async (t, s) => {
        const r = reservaPorToken(t);
        if (r.estado !== 'CONFIRMADA') throw new ErrorServicio('Solo se reprograma una reserva confirmada.', 'datosInvalidos');
        if (s.soporte.size > SOPORTE_MAXIMO_BYTES) throw new ErrorServicio('El archivo pesa más de 5 MB.', 'archivoNoPermitido');
        r.estado = 'EN_REVISION';
        r.reprogramacion = { causal: s.causal, fechaDeseada: s.fechaDeseada, estado: 'PENDIENTE', motivo: null };
        return esperar(structuredClone(r));
      },
      solicitarHistorial: async (correo) => {
        historiales.set(token(), correo.trim().toLowerCase());
        return esperar(undefined);
      },
      iniciarPago: async () => {
        throw new ErrorServicio('Con los datos de demostración no hay pagos: la pasarela solo existe con la API.', 'noDisponible');
      },
      historial: async (t) => {
        const correo = historiales.get(t);
        if (!correo) throw new ErrorServicio('El enlace no es válido o ya caducó.', 'enlaceInvalido');
        const propias: ReservaDelHistorial[] = [...reservas.values()]
          .filter((r) => r.titular.correo.trim().toLowerCase() === correo)
          .map((r) => ({ codigo: r.codigo, senderoId: r.senderoId, senderoNombre: r.senderoNombre, fecha: r.fecha, personas: r.personas, estado: r.estado }))
          .sort((a, b) => b.fecha.localeCompare(a.fecha));
        return esperar(propias);
      },
    },

    operacion: {
      enRevision: () => esperar(revision.map((r) => ({ ...r }))),
      resolverRevision: async (id) => {
        const i = revision.findIndex((r) => r.id === id);
        if (i === -1) throw new ErrorServicio('Esa reserva ya no está en revisión.', 'revisionInexistente');
        revision.splice(i, 1);
        return esperar(undefined);
      },
      reprogramaciones: () => esperar(reprogramaciones.filter((p) => p.estado === 'PENDIENTE').map((p) => ({ ...p }))),
      soporteReprogramacion: async () => esperar(new Blob(['%PDF-1.4 soporte de demostración'], { type: 'application/pdf' })),
      decidirReprogramacion: async (id, aprobar) => {
        const p = reprogramaciones.find((x) => x.id === id);
        if (!p || p.estado !== 'PENDIENTE') throw new ErrorServicio('Esa solicitud ya fue decidida.', 'revisionInexistente');
        p.estado = aprobar ? 'APROBADA' : 'RECHAZADA';
        return esperar(undefined);
      },
      salidasDelDia: () => esperar([
        { hora: '06:30', senderoNombre: 'Chorreras', personas: 12, guia: 'Julián P.' },
        { hora: '07:00', senderoNombre: 'Lagunas de Siecha', personas: 16, guia: 'Marta L.' },
        { hora: '08:00', senderoNombre: 'Bosque de Niebla', personas: 11, guia: null },
        { hora: '09:30', senderoNombre: 'La Paila', personas: 8, guia: 'Andrés C.' },
      ]),
      reservasDelPeriodo: (desde, hasta) =>
        esperar(panel.filter((r) => r.fecha >= desde && r.fecha <= hasta).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((r) => structuredClone(r))),
      guias: () => esperar(guias.map((g) => ({ ...g }))),
      asignarGuia: async (reservaId, guiaId) => {
        const r = panel.find((x) => x.id === reservaId);
        const g = guias.find((x) => x.id === guiaId);
        if (!r || !g) throw new ErrorServicio('La reserva o el guía ya no existen.', 'datosInvalidos');
        if (r.estado !== 'CONFIRMADA') throw new ErrorServicio('Solo se puede asignar un guía a una reserva confirmada.', 'datosInvalidos');
        r.guiaId = g.id;
        r.guiaNombre = g.nombre;
        return esperar(undefined);
      },
      capacidad: (desde, hasta) => {
        const dias: CapacidadDia[] = [];
        for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
          for (const s of catalogo.filter((x) => x.activo)) {
            const d = disponibilidad(s.id, fecha);
            dias.push({ senderoId: s.id, fecha, cupoMaximo: d.limite, umbralPct: capacidadCargada.get(`${s.id}|${fecha}`)?.umbralPct ?? 80, ocupacion: d.ocupados });
          }
        }
        return esperar(dias);
      },
      cargarCapacidad: async (senderoId, dias) => {
        buscarSendero(senderoId);
        for (const d of dias) {
          if (d.cupoMaximo < disponibilidad(senderoId, d.fecha).ocupados) {
            throw new ErrorServicio(`El cupo del ${d.fecha} no puede quedar por debajo de las personas ya reservadas.`, 'datosInvalidos');
          }
        }
        dias.forEach((d) => capacidadCargada.set(`${senderoId}|${d.fecha}`, { cupoMaximo: d.cupoMaximo, umbralPct: d.umbralPct }));
        return esperar(undefined);
      },
      ocupacion: (fecha) => esperar(
        ['lagunas-de-siecha', 'chorreras', 'bosque-de-niebla', 'suasie', 'la-paila'].map((id): OcupacionSendero => {
          const d = disponibilidad(id, fecha);
          return { senderoNombre: buscarSendero(id).nombre, ocupados: d.ocupados, limite: d.limite, umbralPct: 80 };
        }),
      ),
      salidaDelGuia: () => esperar({
        senderoNombre: 'Lagunas de Siecha', hora: '07:00', total: 10, reservaIds: ['rs0', 'rs2', 'rs4', 'rs5', 'rs7'],
        requerimientos: [{ codigo: 'NT-2RX7KD', texto: 'Felipe tiene asma y lleva inhalador' }],
        visitantes: visitantes.map((v) => ({ ...v })), sinRegistrar: 2, cerrada: salidaCerrada,
      }),
      marcarAsistencia: async (v, presente) => {
        const encontrado = visitantes.find((x) => x.id === v.id);
        if (encontrado) encontrado.presente = presente;
        return esperar(undefined);
      },
      cerrarSalida: async () => {
        salidaCerrada = true;
        return esperar(undefined);
      },
      agendaGuia: async (desde, dias) => esperar(
        Array.from({ length: dias }, (_, i) => i)
          .filter((i) => i !== 2 && i !== 5)
          .map((i) => {
            const s = SENDEROS[(i * 4 + 9) % SENDEROS.length];
            return { fecha: sumarDias(desde, i), hora: s.horaSalida, senderoNombre: s.nombre, personas: 8 + ((i * 7) % 9), puntoEncuentro: s.puntoEncuentro };
          }),
      ),
      escucharEventos: (alEvento) => {
        suscriptores.add(alEvento);
        return () => {
          suscriptores.delete(alEvento);
        };
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

    biblioteca: { listar: cargarBiblioteca },
    autenticacion: {
      iniciarSesion: async (correo, clave) => {
        const cuenta = CUENTAS_DEMO.find((c) => c.correo === correo.trim().toLowerCase());
        if (!cuenta || clave !== CLAVE_DEMO) throw new ErrorServicio('Correo o contraseña incorrectos.', 'credenciales');
        return esperar({ nombre: cuenta.nombre, correo: cuenta.correo, rol: cuenta.rol, token: token() });
      },
      cerrarSesion: async () => esperar(undefined),
      solicitarRecuperacion: async () => esperar(undefined),
      restablecerClave: async (enlace, nueva) => {
        if (!enlace) throw new ErrorServicio('El enlace venció o ya se usó.', 'enlaceRecuperacionVencido');
        if (nueva.length < LARGO_MINIMO_CLAVE) throw new ErrorServicio('La contraseña es muy corta.', 'datosInvalidos');
        return esperar(undefined);
      },
    },
  };
}
