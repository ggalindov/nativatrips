import type { Sendero } from '@/domain/sendero';

/**
 * Catálogo de los 13 senderos. Sector, desnivel, altitud, tarifa y textos vienen
 * del prototipo de Figma del equipo y deben validarse con el operador.
 */
export const SENDEROS: readonly Sendero[] = [
  {
    id: 'la-paila', nombre: 'La Paila', dificultad: 'Fácil', duracionHoras: 1, distanciaKm: 1.8, horaSalida: '09:30',
    sector: 'Sector La Paila', desnivelM: 60, altitudMaxM: 3080, precioPorPersona: 120000,
    descripcion: 'Paseo corto y accesible hacia una hermosa caldera natural con aguas termales y rica vegetación de piedemonte andino.',
    destacados: ['Sendero señalizado corto', 'Zonas de descanso', 'Accesible para movilidad reducida'],
    puntoEncuentro: 'Estación de Guardaparques La Paila',
  },
  {
    id: 'laguna-seca', nombre: 'Laguna Seca', dificultad: 'Fácil', duracionHoras: 2, distanciaKm: 3.5, horaSalida: '09:00',
    sector: 'Sector Piedras Gordas', desnivelM: 120, altitudMaxM: 3150, precioPorPersona: 135000,
    descripcion: 'Sendero interpretativo suave rodeando la cuenca de la antigua laguna glacial, con abundante presencia de fauna silvestre y turberas.',
    destacados: ['Turberas altoandinas', 'Sendero plano y seguro', 'Apto para todas las edades'],
    puntoEncuentro: 'Piedras Gordas Entrada Sur',
  },
  {
    id: 'la-arboleda', nombre: 'La Arboleda', dificultad: 'Fácil', duracionHoras: 2.5, distanciaKm: 4.2, horaSalida: '08:30',
    sector: 'Sector Piedras Gordas', desnivelM: 180, altitudMaxM: 3200, precioPorPersona: 145000,
    descripcion: 'Ideal para familias y principiantes. Atraviesa hermosos bosques andinos de niebla repletos de orquídeas, bromelias y musgos milenarios.',
    destacados: ['Bosque andino relicto', 'Senderos de baja pendiente', 'Observación botánica y orquídeas'],
    puntoEncuentro: 'Puesto de Control Piedras Gordas',
  },
  {
    id: 'el-retiro', nombre: 'El Retiro', dificultad: 'Fácil', duracionHoras: 3, distanciaKm: 5.5, horaSalida: '08:30',
    sector: 'Sector La Calera', desnivelM: 210, altitudMaxM: 3250, precioPorPersona: 150000,
    descripcion: 'Un retiro de paz y silencio a menos de 90 minutos de Bogotá, perfecto para reconectar con el aire puro y la tranquilidad del páramo.',
    destacados: ['Cercanía a Bogotá', 'Zonas de descanso y meditación', 'Bosque de encenillos'],
    puntoEncuentro: 'Entrada Sector La Calera',
  },
  {
    id: 'bosque-de-niebla', nombre: 'Bosque de Niebla', dificultad: 'Moderado', duracionHoras: 3, distanciaKm: 5.5, horaSalida: '08:00',
    sector: 'Sector Monterredondo', desnivelM: 310, altitudMaxM: 3300, precioPorPersona: 160000,
    descripcion: 'Inmersión en el bosque nublado donde la condensación crea un microclima de musgos colgantes, helechos arborescentes y aves multicolores.',
    destacados: ['Helechos arborescentes gigantes', 'Bosque nuboso primario', 'Fotografía de naturaleza'],
    puntoEncuentro: 'Km 22 Vía Monterredondo',
  },
  {
    id: 'monterredondo', nombre: 'Monterredondo', dificultad: 'Moderado', duracionHoras: 3.5, distanciaKm: 7, horaSalida: '08:00',
    sector: 'Sector Monterredondo', desnivelM: 360, altitudMaxM: 3380, precioPorPersona: 165000,
    descripcion: 'Ruta circular emblemática que rodea el antiguo centro de operaciones del parque con miradores hacia el embalse de Chuza y la cordillera.',
    destacados: ['Vista panorámica Embalse de Chuza', 'Puntos de avistamiento de venados', 'Historia de la conservación'],
    puntoEncuentro: 'Centro Administrativo Monterredondo',
  },
  {
    id: 'suasie', nombre: 'Suasie', dificultad: 'Moderado', duracionHoras: 4, distanciaKm: 8.5, horaSalida: '07:30',
    sector: 'Sector Monterredondo', desnivelM: 420, altitudMaxM: 3450, precioPorPersona: 175000,
    descripcion: 'Travesía fascinante por el valle de los frailejones gigantes y senderos de herradura históricos, con vistas panorámicas a los cañones orientales.',
    destacados: ['Valle de frailejones gigantes', 'Cruce de quebradas cristalinas', 'Senderos coloniales'],
    puntoEncuentro: 'Centro de Visitantes Monterredondo',
  },
  {
    id: 'rio-la-playa', nombre: 'Río La Playa', dificultad: 'Moderado', duracionHoras: 4, distanciaKm: 8, horaSalida: '07:30',
    sector: 'Sector Guasca', desnivelM: 380, altitudMaxM: 3320, precioPorPersona: 165000,
    descripcion: 'Acompaña el cauce cristalino del Río La Playa entre cañones rocosos y valles de vegetación exuberante adaptada a corrientes frías.',
    destacados: ['Riberas de aguas glaciares', 'Pozos naturales cristalinos', 'Puentes de madera rústicos'],
    puntoEncuentro: 'Puente Guasca Km 18',
  },
  {
    id: 'los-caquezas', nombre: 'Los Cáquezas', dificultad: 'Moderado', duracionHoras: 4.5, distanciaKm: 9.2, horaSalida: '07:00',
    sector: 'Sector San Juanito', desnivelM: 490, altitudMaxM: 3520, precioPorPersona: 180000,
    descripcion: 'Caminata por la vertiente oriental hacia el llano, donde el páramo transiciona a densos bosques de niebla con cascadas prístinas.',
    destacados: ['Cascadas naturales', 'Vertiente oriental andina', 'Comunidad campesina local'],
    puntoEncuentro: 'Casas de Guardaparques San Juanito',
  },
  {
    id: 'lagunas-de-siecha', nombre: 'Lagunas de Siecha', dificultad: 'Moderado', duracionHoras: 5, distanciaKm: 10, horaSalida: '07:00',
    sector: 'Sector Siecha', desnivelM: 580, altitudMaxM: 3680, precioPorPersona: 185000,
    descripcion: 'Recorre el camino ancestral muisca hasta las tres lagunas sagradas de Siecha, rodeadas de frailejones centenarios y paisajes de páramo a más de 3.500 metros de altitud. Una experiencia de conexión profunda con la naturaleza.',
    destacados: ['Lagunas sagradas muiscas', 'Bosque de frailejones', 'Mirador de alta montaña', 'Avistamiento de aves de páramo'],
    puntoEncuentro: 'Parqueadero Monterredondo, Sector Siecha',
  },
  {
    id: 'piedras-gordas', nombre: 'Piedras Gordas', dificultad: 'Difícil', duracionHoras: 5.5, distanciaKm: 11, horaSalida: '07:00',
    sector: 'Sector Piedras Gordas', desnivelM: 640, altitudMaxM: 3620, precioPorPersona: 195000,
    descripcion: 'Caminata entre colosales formaciones rocosas esculpidas por antiguos glaciares andinos, con pasos técnicos de montaña.',
    destacados: ['Laberintos rocosos megalíticos', 'Formaciones de arenisca', 'Flora xerofítica de páramo'],
    puntoEncuentro: 'Refugio Piedras Gordas',
  },
  {
    id: 'cuchilla-el-zaque', nombre: 'Cuchilla el Zaque', dificultad: 'Exigente', duracionHoras: 6, distanciaKm: 13.5, horaSalida: '06:30',
    sector: 'Sector Siecha', desnivelM: 720, altitudMaxM: 3820, precioPorPersona: 210000,
    descripcion: 'Ascenso de alta exigencia física por crestas escarpadas con vientos de alta montaña y una visión de 360 grados de los valles interandinos.',
    destacados: ['Cresta panorámica El Zaque', 'Formaciones geológicas milenarias', 'Desafío físico andino'],
    puntoEncuentro: 'Puesto de Control Siecha',
  },
  {
    id: 'chorreras', nombre: 'Chorreras', dificultad: 'Exigente', duracionHoras: 8, distanciaKm: 16, horaSalida: '06:30',
    sector: 'Sector Choachí', desnivelM: 950, altitudMaxM: 3700, precioPorPersona: 225000,
    descripcion: 'Gran expedición de resistencia cruzando caídas de agua monumentales y senderos ancestrales que conectan el altiplano con los valles calientes.',
    destacados: ['Cascadas de más de 80m', 'Gran exigencia física', 'Paisajes contrastantes'],
    puntoEncuentro: 'Parador Choachí La Palma',
  },
];

/** Cuentas del equipo disponibles solo con la fuente de datos en memoria. */
export const CUENTAS_DEMO = [
  { correo: 'admin@ecopalacio.co', nombre: 'Andrea Ruiz', rol: 'PERSONAL_ADMINISTRATIVO' },
  { correo: 'guia@ecopalacio.co', nombre: 'Marta León', rol: 'GUIA_TURISTICO' },
  { correo: 'gerencia@ecopalacio.co', nombre: 'Carlos Palacio', rol: 'GERENCIA' },
] as const;

export const CLAVE_DEMO = 'paramo2026';
