/**
 * Datos de ejemplo de los paneles del personal. Son solo para la interfaz:
 * se reemplazan por los servicios del backend cuando se conecten.
 */
import type { EstadoReserva, Persona, TipoDocumento } from '@/domain/reserva';
import { SENDEROS } from '@/services/memoria/datos';

export const nombreSendero = (id: string) => SENDEROS.find((s) => s.id === id)?.nombre ?? id;

export interface Guia {
  id: string;
  nombre: string;
  idiomas: string[];
  certificacion: string;
  salidasMes: number;
  calificacion: number;
}

export const GUIAS: Guia[] = [
  { id: 'g1', nombre: 'Marta León', idiomas: ['Español', 'Inglés'], certificacion: 'Guía de montaña · primeros auxilios', salidasMes: 18, calificacion: 4.9 },
  { id: 'g2', nombre: 'Julián Pardo', idiomas: ['Español'], certificacion: 'Guía local certificado', salidasMes: 15, calificacion: 4.7 },
  { id: 'g3', nombre: 'Andrés Castro', idiomas: ['Español', 'Francés'], certificacion: 'Guía de montaña', salidasMes: 12, calificacion: 4.8 },
  { id: 'g4', nombre: 'Lucía Méndez', idiomas: ['Español', 'Inglés', 'Portugués'], certificacion: 'Guía bilingüe · rescate', salidasMes: 14, calificacion: 5 },
];

export interface PagoEjemplo {
  fecha: string;
  medio: 'Tarjeta' | 'PSE' | 'Efectivo';
  valor: number;
  estado: 'Aprobado' | 'Rechazado' | 'Pendiente';
}

export interface ReservaEjemplo {
  codigo: string;
  senderoId: string;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
  titular: Persona & { correo: string; celular: string };
  acompanantes: Persona[];
  personas: number;
  total: number;
  guiaId: string | null;
  creada: string;
  nota?: string;
  pagos: PagoEjemplo[];
  historial: { fecha: string; texto: string }[];
}

const p = (nombre: string, nacionalidad: string, tipoDocumento: TipoDocumento, documento: string): Persona => ({ nombre, nacionalidad, tipoDocumento, documento });

export const RESERVAS: ReservaEjemplo[] = [
  {
    codigo: 'NT-7Q4K', senderoId: 'lagunas-de-siecha', fecha: '2026-10-16', hora: '07:00', estado: 'EN_REVISION',
    titular: { ...p('Laura Gómez', 'CO', 'CC', '1020304050'), correo: 'laura@correo.co', celular: '+57 300 123 4567' },
    acompanantes: [p('Diego Gómez', 'CO', 'CC', '98765432')], personas: 3, total: 555000, guiaId: 'g1', creada: '2026-10-10 18:42',
    nota: 'Falta el documento de 1 acompañante',
    pagos: [{ fecha: '2026-10-10 18:50', medio: 'PSE', valor: 555000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-10 18:42', texto: 'Reserva creada · cupo apartado' }, { fecha: '2026-10-10 18:50', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-10 18:51', texto: 'Enviada a revisión: datos incompletos' }],
  },
  {
    codigo: 'NT-3MZ8', senderoId: 'bosque-de-niebla', fecha: '2026-10-17', hora: '08:00', estado: 'EN_REVISION',
    titular: { ...p('Colegio Los Andes', 'CO', 'CC', '79456123'), correo: 'salidas@losandes.edu.co', celular: '+57 310 555 0101' },
    acompanantes: [], personas: 18, total: 2880000, guiaId: null, creada: '2026-10-08 09:15', nota: 'Grupo de 18 · requiere 2 guías',
    pagos: [{ fecha: '2026-10-08 09:20', medio: 'Tarjeta', valor: 2880000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-08 09:15', texto: 'Reserva creada · grupo corporativo' }, { fecha: '2026-10-08 09:20', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-08 09:21', texto: 'Enviada a revisión manual: grupo grande' }],
  },
  {
    codigo: 'NT-9B2T', senderoId: 'chorreras', fecha: '2026-10-18', hora: '06:30', estado: 'EN_REVISION',
    titular: { ...p('Camilo Herrera', 'CO', 'CC', '1032456789'), correo: 'camilo.h@correo.co', celular: '+57 315 222 3344' },
    acompanantes: [p('Sofía Herrera', 'CO', 'TI', '1101234567')], personas: 2, total: 450000, guiaId: null, creada: '2026-10-11 20:03',
    nota: 'Menor de edad en un sendero exigente',
    pagos: [{ fecha: '2026-10-11 20:10', medio: 'Tarjeta', valor: 450000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-11 20:03', texto: 'Reserva creada' }, { fecha: '2026-10-11 20:10', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-11 20:10', texto: 'Enviada a revisión: menor de edad' }],
  },
  {
    codigo: 'NT-5HC1', senderoId: 'lagunas-de-siecha', fecha: '2026-10-14', hora: '07:00', estado: 'CONFIRMADA',
    titular: { ...p('Claire Martin', 'FR', 'PASAPORTE', '19AB12345'), correo: 'claire.martin@exemple.fr', celular: '+33 6 12 34 56 78' },
    acompanantes: [p('Hugo Martin', 'FR', 'PASAPORTE', '19AB67890')], personas: 2, total: 370000, guiaId: 'g3', creada: '2026-10-02 11:20',
    pagos: [{ fecha: '2026-10-02 11:26', medio: 'Tarjeta', valor: 370000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-02 11:20', texto: 'Reserva creada' }, { fecha: '2026-10-02 11:26', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-03 09:00', texto: 'Confirmada · guía Andrés Castro (francés)' }],
  },
  {
    codigo: 'NT-8LP0', senderoId: 'lagunas-de-siecha', fecha: '2026-10-14', hora: '07:00', estado: 'CONFIRMADA',
    titular: { ...p('John Carter', 'US', 'PASAPORTE', 'X12345678'), correo: 'jcarter@mail.com', celular: '+1 202 555 0143' },
    acompanantes: [p('Emma Carter', 'US', 'PASAPORTE', 'X87654321'), p('Valentina Ríos', 'CO', 'CC', '52123456')], personas: 3, total: 555000, guiaId: 'g1', creada: '2026-09-29 16:05',
    nota: 'Asma · lleva inhalador',
    pagos: [{ fecha: '2026-09-29 16:09', medio: 'Tarjeta', valor: 555000, estado: 'Rechazado' }, { fecha: '2026-09-29 16:14', medio: 'Tarjeta', valor: 555000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-09-29 16:05', texto: 'Reserva creada' }, { fecha: '2026-09-29 16:09', texto: 'Pago rechazado (1 de 2 intentos)' }, { fecha: '2026-09-29 16:14', texto: 'Pago aprobado por PayU' }, { fecha: '2026-09-30 08:30', texto: 'Confirmada' }],
  },
  {
    codigo: 'NT-2RX7', senderoId: 'la-paila', fecha: '2026-10-14', hora: '09:30', estado: 'CONFIRMADA',
    titular: { ...p('Juan Pablo Díaz', 'CO', 'CC', '80123456'), correo: 'jpdiaz@correo.co', celular: '+57 301 444 5566' },
    acompanantes: [p('Mariana Díaz', 'CO', 'CC', '53987654')], personas: 4, total: 480000, guiaId: 'g2', creada: '2026-10-05 10:00',
    pagos: [{ fecha: '2026-10-05 10:04', medio: 'Efectivo', valor: 480000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-05 10:00', texto: 'Reserva creada' }, { fecha: '2026-10-06 15:00', texto: 'Pago en efectivo confirmado' }, { fecha: '2026-10-06 15:05', texto: 'Confirmada' }],
  },
  {
    codigo: 'NT-K4W9', senderoId: 'suasie', fecha: '2026-10-19', hora: '07:30', estado: 'PENDIENTE_PAGO',
    titular: { ...p('Lucas Ferreira', 'BR', 'PASAPORTE', 'FZ123456'), correo: 'lucas.ferreira@email.com.br', celular: '+55 11 91234 5678' },
    acompanantes: [], personas: 2, total: 350000, guiaId: null, creada: '2026-10-13 21:40',
    pagos: [{ fecha: '2026-10-13 21:41', medio: 'PSE', valor: 350000, estado: 'Pendiente' }],
    historial: [{ fecha: '2026-10-13 21:40', texto: 'Reserva creada · cupo apartado' }],
  },
  {
    codigo: 'NT-W7N3', senderoId: 'monterredondo', fecha: '2026-10-20', hora: '08:00', estado: 'CONFIRMADA',
    titular: { ...p('Daniela Rojas', 'VE', 'PPT', '5123456'), correo: 'daniela.rojas@correo.com', celular: '+57 312 777 8899' },
    acompanantes: [p('Andrés Rojas', 'VE', 'PPT', '5123457')], personas: 2, total: 330000, guiaId: 'g4', creada: '2026-10-07 12:12',
    pagos: [{ fecha: '2026-10-07 12:15', medio: 'PSE', valor: 330000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-07 12:12', texto: 'Reserva creada' }, { fecha: '2026-10-07 12:15', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-07 14:00', texto: 'Confirmada' }],
  },
  {
    codigo: 'NT-B6T2', senderoId: 'cuchilla-el-zaque', fecha: '2026-10-21', hora: '06:30', estado: 'CONFIRMADA',
    titular: { ...p('Hannah Schmidt', 'DE', 'PASAPORTE', 'C01X00T47'), correo: 'h.schmidt@mail.de', celular: '+49 151 23456789' },
    acompanantes: [p('Jonas Weber', 'DE', 'PASAPORTE', 'C02Y11U58')], personas: 2, total: 420000, guiaId: 'g4', creada: '2026-10-01 07:45',
    pagos: [{ fecha: '2026-10-01 07:49', medio: 'Tarjeta', valor: 420000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-10-01 07:45', texto: 'Reserva creada' }, { fecha: '2026-10-01 07:49', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-01 10:00', texto: 'Confirmada · guía bilingüe' }],
  },
  {
    codigo: 'NT-Q9D5', senderoId: 'laguna-seca', fecha: '2026-10-09', hora: '09:00', estado: 'COMPLETADA',
    titular: { ...p('Pedro Sánchez', 'CO', 'CC', '79888777'), correo: 'pedro.s@correo.co', celular: '+57 300 999 1111' },
    acompanantes: [p('Ana Sánchez', 'CO', 'CC', '52666555'), p('Tomás Sánchez', 'CO', 'TI', '1102345678')], personas: 3, total: 405000, guiaId: 'g2', creada: '2026-09-28 19:30',
    pagos: [{ fecha: '2026-09-28 19:34', medio: 'Tarjeta', valor: 405000, estado: 'Aprobado' }],
    historial: [{ fecha: '2026-09-28 19:30', texto: 'Reserva creada' }, { fecha: '2026-09-28 19:34', texto: 'Pago aprobado por PayU' }, { fecha: '2026-10-09 13:10', texto: 'Tour cerrado · asistencia 3 de 3' }],
  },
  {
    codigo: 'NT-H3J8', senderoId: 'el-retiro', fecha: '2026-10-12', hora: '08:30', estado: 'CANCELADA',
    titular: { ...p('Mariana López', 'MX', 'PASAPORTE', 'G12345678'), correo: 'mariana.lopez@correo.mx', celular: '+52 55 1234 5678' },
    acompanantes: [], personas: 1, total: 150000, guiaId: null, creada: '2026-10-03 13:00',
    pagos: [{ fecha: '2026-10-03 13:04', medio: 'Tarjeta', valor: 150000, estado: 'Rechazado' }, { fecha: '2026-10-03 13:09', medio: 'Tarjeta', valor: 150000, estado: 'Rechazado' }],
    historial: [{ fecha: '2026-10-03 13:00', texto: 'Reserva creada' }, { fecha: '2026-10-03 13:09', texto: 'Dos pagos rechazados · reserva cancelada y cupo liberado' }],
  },
  {
    codigo: 'NT-M2V6', senderoId: 'la-arboleda', fecha: '2026-10-15', hora: '08:30', estado: 'EXPIRADA',
    titular: { ...p('Santiago Prieto', 'CO', 'CC', '1015432198'), correo: 'sprieto@correo.co', celular: '+57 318 123 0000' },
    acompanantes: [], personas: 2, total: 290000, guiaId: null, creada: '2026-10-12 08:00',
    pagos: [],
    historial: [{ fecha: '2026-10-12 08:00', texto: 'Reserva creada · cupo apartado' }, { fecha: '2026-10-12 08:30', texto: 'Tiempo de pago vencido · cupo liberado' }],
  },
];

export interface LimiteCapacidad {
  id: string;
  senderoId: string;
  temporada: 'Alta' | 'Media' | 'Baja';
  desde: string;
  hasta: string;
  cupoDiario: number;
  maxGrupo: number;
  ocupacionPct: number;
}

const TEMPORADAS: [LimiteCapacidad['temporada'], string, string][] = [['Alta', '2026-12-15', '2027-01-15'], ['Media', '2026-10-01', '2026-12-14'], ['Baja', '2027-01-16', '2027-03-31']];

export const LIMITES: LimiteCapacidad[] = SENDEROS.flatMap((s, i) =>
  TEMPORADAS.map(([temporada, desde, hasta], j) => ({
    id: `${s.id}-${j}`,
    senderoId: s.id,
    temporada,
    desde,
    hasta,
    cupoDiario: (temporada === 'Alta' ? 35 : temporada === 'Media' ? 25 : 18) - (s.dificultad === 'Exigente' ? 10 : s.dificultad === 'Difícil' ? 5 : 0),
    maxGrupo: s.dificultad === 'Exigente' ? 8 : 12,
    ocupacionPct: temporada === 'Media' ? [82, 74, 66, 58, 91, 47, 69, 55, 61, 88, 72, 79, 93][i] : 0,
  })),
);

export interface Conversacion {
  id: string;
  visitante: string;
  idioma: 'es' | 'en' | 'fr' | 'pt';
  motivo: string;
  hace: string;
  estado: 'Nueva' | 'En curso' | 'Resuelta';
  mensajes: { de: 'visitante' | 'frailin' | 'equipo'; texto: string; hora: string }[];
}

export const CONVERSACIONES: Conversacion[] = [
  {
    id: 'c1', visitante: 'Visitante anónimo', idioma: 'en', motivo: 'Transporte desde Bogotá', hace: 'hace 4 min', estado: 'Nueva',
    mensajes: [
      { de: 'visitante', texto: 'Hi! Is there transport from Bogotá to Siecha?', hora: '09:12' },
      { de: 'frailin', texto: 'I’m still learning about transport options. Would you like to talk to our team?', hora: '09:12' },
      { de: 'visitante', texto: 'Yes please', hora: '09:13' },
    ],
  },
  {
    id: 'c2', visitante: 'Claire Martin · NT-5HC1', idioma: 'fr', motivo: 'Changement de date', hace: 'hace 25 min', estado: 'En curso',
    mensajes: [
      { de: 'visitante', texto: 'Bonjour, puis-je changer la date de ma réservation NT-5HC1 ?', hora: '08:40' },
      { de: 'frailin', texto: 'Je transmets votre demande à notre équipe.', hora: '08:40' },
      { de: 'equipo', texto: 'Bonjour Claire, quelle date souhaitez-vous ?', hora: '08:52' },
    ],
  },
  {
    id: 'c3', visitante: 'Visitante anónimo', idioma: 'es', motivo: 'Grupo empresarial de 25 personas', hace: 'hace 1 h', estado: 'Nueva',
    mensajes: [
      { de: 'visitante', texto: 'Hola, queremos llevar un grupo de 25 personas de la empresa en noviembre.', hora: '08:05' },
      { de: 'frailin', texto: 'Los grupos grandes los coordina nuestro equipo. Te pongo en contacto.', hora: '08:05' },
    ],
  },
  {
    id: 'c4', visitante: 'Lucas Ferreira · NT-K4W9', idioma: 'pt', motivo: 'Pagamento com cartão estrangeiro', hace: 'ayer', estado: 'Resuelta',
    mensajes: [
      { de: 'visitante', texto: 'Meu cartão brasileiro foi recusado. Posso pagar de outra forma?', hora: '21:45' },
      { de: 'equipo', texto: 'Olá Lucas! Pode tentar novamente com PSE ou pagar em dinheiro no ponto de encontro.', hora: '21:58' },
    ],
  },
];

export interface CuentaEquipo {
  id: string;
  nombre: string;
  correo: string;
  rol: 'PERSONAL_ADMINISTRATIVO' | 'GUIA_TURISTICO' | 'GERENCIA';
  activa: boolean;
  ultimoAcceso: string;
}

export const CUENTAS: CuentaEquipo[] = [
  { id: 'u1', nombre: 'Carlos Palacio', correo: 'gerencia@ecopalacio.co', rol: 'GERENCIA', activa: true, ultimoAcceso: 'hoy 07:58' },
  { id: 'u2', nombre: 'Andrea Ruiz', correo: 'admin@ecopalacio.co', rol: 'PERSONAL_ADMINISTRATIVO', activa: true, ultimoAcceso: 'hoy 06:40' },
  { id: 'u3', nombre: 'Felipe Ortiz', correo: 'reservas@ecopalacio.co', rol: 'PERSONAL_ADMINISTRATIVO', activa: true, ultimoAcceso: 'ayer 18:12' },
  { id: 'u4', nombre: 'Marta León', correo: 'guia@ecopalacio.co', rol: 'GUIA_TURISTICO', activa: true, ultimoAcceso: 'hoy 05:55' },
  { id: 'u5', nombre: 'Julián Pardo', correo: 'julian.pardo@ecopalacio.co', rol: 'GUIA_TURISTICO', activa: true, ultimoAcceso: 'hoy 06:02' },
  { id: 'u6', nombre: 'Andrés Castro', correo: 'andres.castro@ecopalacio.co', rol: 'GUIA_TURISTICO', activa: true, ultimoAcceso: 'hace 2 días' },
  { id: 'u7', nombre: 'Lucía Méndez', correo: 'lucia.mendez@ecopalacio.co', rol: 'GUIA_TURISTICO', activa: true, ultimoAcceso: 'hoy 06:10' },
  { id: 'u8', nombre: 'Pablo Vargas', correo: 'pablo.vargas@ecopalacio.co', rol: 'GUIA_TURISTICO', activa: false, ultimoAcceso: 'hace 3 meses' },
];

export const NOTIFICACIONES = [
  { id: 'n1', texto: 'Nueva reserva confirmada · NT-W7N3 · Monterredondo', hace: 'hace 6 min', tipo: 'reserva' as const },
  { id: 'n2', texto: 'Chorreras llegó al 93 % del cupo del 18/10', hace: 'hace 20 min', tipo: 'alerta' as const },
  { id: 'n3', texto: 'Conversación derivada del chat · transporte desde Bogotá', hace: 'hace 4 min', tipo: 'chat' as const },
  { id: 'n4', texto: 'NT-3MZ8 espera revisión: grupo de 18 personas', hace: 'hace 1 h', tipo: 'revision' as const },
];

/** Métricas del mes para el tablero de gerencia. */
export const METRICAS = {
  mes: '2026-10',
  ingresos: 186_450_000,
  ingresosMesAnterior: 162_300_000,
  visitantes: 1284,
  reservas: 412,
  conversionPct: 31,
  conversionMesAnterior: 27,
  nps: 72,
  respuestasNps: 236,
  npsDistribucion: { promotores: 168, pasivos: 50, detractores: 18 },
  ingresosMensuales: [
    { mes: '2026-05', valor: 98_200_000 },
    { mes: '2026-06', valor: 121_500_000 },
    { mes: '2026-07', valor: 158_900_000 },
    { mes: '2026-08', valor: 149_100_000 },
    { mes: '2026-09', valor: 162_300_000 },
    { mes: '2026-10', valor: 186_450_000 },
  ],
  procedencia: [
    { pais: 'CO', visitantes: 948 },
    { pais: 'US', visitantes: 97 },
    { pais: 'FR', visitantes: 61 },
    { pais: 'DE', visitantes: 44 },
    { pais: 'BR', visitantes: 38 },
    { pais: 'VE', visitantes: 33 },
    { pais: 'MX', visitantes: 26 },
    { pais: 'OTROS', visitantes: 37 },
  ],
};

/** Reporte de cumplimiento ambiental por sendero (RF-27, RF-39). */
export const REPORTE_AMBIENTAL = SENDEROS.map((s, i) => {
  const limite = (s.dificultad === 'Exigente' ? 15 : s.dificultad === 'Difícil' ? 20 : 25) * 31;
  const visitantes = Math.round(limite * [0.82, 0.74, 0.66, 0.58, 0.91, 0.47, 0.69, 0.55, 0.61, 0.88, 0.72, 0.79, 0.93][i]);
  return { senderoId: s.id, limite, visitantes, diasSobreUmbral: [3, 1, 0, 0, 6, 0, 1, 0, 0, 5, 1, 2, 7][i], incidentes: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0][i], toursCerrados: Math.round(visitantes / 9) };
});

/** Pesos del motor de recomendación (RF-40). */
export const PESOS_RECOMENDACION = { dificultad: 40, temporada: 25, perfil: 20, historial: 15 };
