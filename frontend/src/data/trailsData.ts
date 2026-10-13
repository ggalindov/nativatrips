export interface AvailableDate {
  date: string;
  display: string;
  slots: number;
  urgent?: boolean;
}

export interface Trail {
  id: string;
  name: string;
  sector: string;
  difficulty: 'Fácil' | 'Moderado' | 'Difícil' | 'Exigente';
  duration: string;
  distance: string;
  elevationGain: string;
  maxAltitude: string;
  pricePerPerson: number;
  image: string;
  description: string;
  highlights: string[];
  meetingPoint: string;
  availableDates: AvailableDate[];
  soldOut?: boolean;
  suggestedAltDates?: string[];
}

export const TRAILS_DATA: Trail[] = [
  {
    id: 'lagunas-de-siecha',
    name: 'Sendero Lagunas de Siecha',
    sector: 'Sector Siecha · PNN Chingaza',
    difficulty: 'Moderado',
    duration: '5 Horas',
    distance: '10 km',
    elevationGain: '580m',
    maxAltitude: '3.680 m.s.n.m.',
    pricePerPerson: 185000,
    image: '/assets/2a205.png',
    description: 'Recorre el camino ancestral muisca hasta las tres lagunas sagradas de Siecha, rodeadas de frailejones centenarios y paisajes de páramo a más de 3,500 metros de altitud. Una experiencia de conexión profunda con la naturaleza.',
    highlights: ['Lagunas sagradas muiscas', 'Bosque de frailejones', 'Mirador de alta montaña', 'Avistamiento de aves de páramo'],
    meetingPoint: 'Parqueadero Monterredondo, Sector Siecha',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 6, urgent: false },
      { date: '2025-12-15', display: 'Dom 15 Dic 2025', slots: 2, urgent: true },
      { date: '2025-12-21', display: 'Sáb 21 Dic 2025', slots: 10, urgent: false },
      { date: '2025-12-28', display: 'Sáb 28 Dic 2025', slots: 8, urgent: false },
      { date: '2026-01-11', display: 'Sáb 11 Ene 2026', slots: 12, urgent: false }
    ]
  },
  {
    id: 'suasie',
    name: 'Sendero Suasie',
    sector: 'Sector Monterredondo',
    difficulty: 'Moderado',
    duration: '4 Horas',
    distance: '8.5 km',
    elevationGain: '420m',
    maxAltitude: '3.450 m.s.n.m.',
    pricePerPerson: 175000,
    image: '/assets/a570c.png',
    description: 'Travesía fascinante por el valle de los frailejones gigantes y senderos de herradura históricos, con vistas panorámicas a los cañones orientales.',
    highlights: ['Valle de frailejones gigantes', 'Cruce de quebradas cristalinas', 'Senderos coloniales'],
    meetingPoint: 'Centro de Visitantes Monterredondo',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 8, urgent: false },
      { date: '2025-12-21', display: 'Sáb 21 Dic 2025', slots: 4, urgent: true },
      { date: '2026-01-04', display: 'Dom 04 Ene 2026', slots: 10, urgent: false }
    ]
  },
  {
    id: 'la-arboleda',
    name: 'Sendero La Arboleda',
    sector: 'Sector Piedras Gordas',
    difficulty: 'Fácil',
    duration: '2.5 Horas',
    distance: '4.2 km',
    elevationGain: '180m',
    maxAltitude: '3.200 m.s.n.m.',
    pricePerPerson: 145000,
    image: '/assets/841dd.png',
    description: 'Ideal para familias y principiantes. Atraviesa hermosos bosques andinos de niebla repletos de orquídeas, bromelias y musgos milenarios.',
    highlights: ['Bosque andino relicto', 'Senderos de baja pendiente', 'Observación botánica y orquídeas'],
    meetingPoint: 'Puesto de Control Piedras Gordas',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 12, urgent: false },
      { date: '2025-12-20', display: 'Sáb 20 Dic 2025', slots: 7, urgent: false },
      { date: '2025-12-28', display: 'Dom 28 Dic 2025', slots: 5, urgent: false }
    ]
  },
  {
    id: 'monterredondo',
    name: 'Sendero Monterredondo',
    sector: 'Sector Monterredondo',
    difficulty: 'Moderado',
    duration: '3.5 Horas',
    distance: '7.0 km',
    elevationGain: '360m',
    maxAltitude: '3.380 m.s.n.m.',
    pricePerPerson: 165000,
    image: '/assets/6a416.png',
    description: 'Ruta circular emblemática que rodea el antiguo centro de operaciones del parque con miradores hacia el embalse de Chuza y la cordillera.',
    highlights: ['Vista panorámica Embalse de Chuza', 'Puntos de avistamiento de venados', 'Historia de la conservación'],
    meetingPoint: 'Centro Administrativo Monterredondo',
    availableDates: [
      { date: '2025-12-15', display: 'Dom 15 Dic 2025', slots: 6, urgent: false },
      { date: '2025-12-22', display: 'Lun 22 Dic 2025', slots: 9, urgent: false },
      { date: '2026-01-05', display: 'Lun 05 Ene 2026', slots: 11, urgent: false }
    ]
  },
  {
    id: 'cuchilla-el-zaque',
    name: 'Sendero Cuchilla el Zaque',
    sector: 'Sector Siecha',
    difficulty: 'Exigente',
    duration: '6 Horas',
    distance: '13.5 km',
    elevationGain: '720m',
    maxAltitude: '3.820 m.s.n.m.',
    pricePerPerson: 210000,
    image: '/assets/cae60.png',
    description: 'Ascenso de alta exigencia física por crestas escarpadas con vientos de alta montaña y una visión de 360 grados de los valles interandinos.',
    highlights: ['Cresta panorámica El Zaque', 'Formaciones geológicas milenarias', 'Desafío físico andino'],
    meetingPoint: 'Puesto de Control Siecha',
    availableDates: [
      { date: '2025-12-20', display: 'Sáb 20 Dic 2025', slots: 3, urgent: true },
      { date: '2025-12-27', display: 'Sáb 27 Dic 2025', slots: 5, urgent: false },
      { date: '2026-01-10', display: 'Sáb 10 Ene 2026', slots: 8, urgent: false }
    ]
  },
  {
    id: 'laguna-seca',
    name: 'Sendero Laguna Seca',
    sector: 'Sector Piedras Gordas',
    difficulty: 'Fácil',
    duration: '2 Horas',
    distance: '3.5 km',
    elevationGain: '120m',
    maxAltitude: '3.150 m.s.n.m.',
    pricePerPerson: 135000,
    image: '/assets/9899e.png',
    description: 'Sendero interpretativo suave rodeando la cuenca de la antigua laguna glacial, con abundante presencia de fauna silvestre y turberas.',
    highlights: ['Turberas altoandinas', 'Sendero plano y seguro', 'Apto para todas las edades'],
    meetingPoint: 'Piedras Gordas Entrada Sur',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 14, urgent: false },
      { date: '2025-12-21', display: 'Dom 21 Dic 2025', slots: 8, urgent: false }
    ]
  },
  {
    id: 'los-caquezas',
    name: 'Sendero Los Cáquezas',
    sector: 'Sector San Juanito',
    difficulty: 'Moderado',
    duration: '4.5 Horas',
    distance: '9.2 km',
    elevationGain: '490m',
    maxAltitude: '3.520 m.s.n.m.',
    pricePerPerson: 180000,
    image: '/assets/f31a9.png',
    description: 'Caminata por la vertiente oriental hacia el llano, donde el páramo transiciona a densos bosques de niebla con cascadas prístinas.',
    highlights: ['Cascadas naturales', 'Vertiente oriental andina', 'Comunidad campesina local'],
    meetingPoint: 'Casas de Guardaparques San Juanito',
    availableDates: [
      { date: '2025-12-21', display: 'Sáb 21 Dic 2025', slots: 6, urgent: false },
      { date: '2025-12-28', display: 'Sáb 28 Dic 2025', slots: 4, urgent: true }
    ]
  },
  {
    id: 'rio-la-playa',
    name: 'Sendero Río La Playa',
    sector: 'Sector Guasca',
    difficulty: 'Moderado',
    duration: '4 Horas',
    distance: '8.0 km',
    elevationGain: '380m',
    maxAltitude: '3.320 m.s.n.m.',
    pricePerPerson: 165000,
    image: '/assets/6ee5a.png',
    description: 'Acompaña el cauce cristalino del Río La Playa entre cañones rocosos y valles de vegetación exuberante adaptada a corrientes frías.',
    highlights: ['Riberas de aguas glaciares', 'Pozos naturales cristalinos', 'Puentes de madera rústicos'],
    meetingPoint: 'Puente Guasca Km 18',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 5, urgent: false },
      { date: '2025-12-20', display: 'Sáb 20 Dic 2025', slots: 7, urgent: false }
    ]
  },
  {
    id: 'el-retiro',
    name: 'Sendero El Retiro',
    sector: 'Sector La Calera',
    difficulty: 'Fácil',
    duration: '3 Horas',
    distance: '5.5 km',
    elevationGain: '210m',
    maxAltitude: '3.250 m.s.n.m.',
    pricePerPerson: 150000,
    image: '/assets/eea02.png',
    description: 'Un retiro de paz y silencio a menos de 90 minutos de Bogotá, perfecto para reconectar con el aire puro y la tranquilidad del páramo.',
    highlights: ['Cercanía a Bogotá', 'Zonas de descanso y meditación', 'Bosque de encenillos'],
    meetingPoint: 'Entrada Sector La Calera',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 10, urgent: false },
      { date: '2025-12-21', display: 'Sáb 21 Dic 2025', slots: 8, urgent: false }
    ]
  },
  {
    id: 'chorreras',
    name: 'Sendero Chorreras',
    sector: 'Sector Choachí',
    difficulty: 'Exigente',
    duration: '8 Horas',
    distance: '16.0 km',
    elevationGain: '950m',
    maxAltitude: '3.700 m.s.n.m.',
    pricePerPerson: 225000,
    image: '/assets/262d2.png',
    description: 'Gran expedición de resistencia cruzando caídas de agua monumentales y senderos ancestrales que conectan el altiplano con los valles calientes.',
    highlights: ['Cascadas de más de 80m', 'Gran exigencia física', 'Paisajes contrastantes'],
    meetingPoint: 'Parador Choachí La Palma',
    availableDates: [
      { date: '2025-12-28', display: 'Sáb 28 Dic 2025', slots: 2, urgent: true },
      { date: '2026-01-04', display: 'Dom 04 Ene 2026', slots: 6, urgent: false },
      { date: '2026-01-18', display: 'Dom 18 Ene 2026', slots: 8, urgent: false }
    ]
  },
  {
    id: 'piedras-gordas',
    name: 'Sendero Piedras Gordas',
    sector: 'Sector Piedras Gordas',
    difficulty: 'Difícil',
    duration: '5.5 Horas',
    distance: '11.0 km',
    elevationGain: '640m',
    maxAltitude: '3.620 m.s.n.m.',
    pricePerPerson: 195000,
    image: '/assets/94ac3.png',
    description: 'Caminata entre colosales formaciones rocosas esculpidas por antiguos glaciares andinos, con pasos técnicos de montaña.',
    highlights: ['Laberintos rocosos megalíticos', 'Formaciones de arenisca', 'Flora xerofítica de páramo'],
    meetingPoint: 'Refugio Piedras Gordas',
    availableDates: [
      { date: '2025-12-27', display: 'Sáb 27 Dic 2025', slots: 4, urgent: true },
      { date: '2026-01-10', display: 'Sáb 10 Ene 2026', slots: 7, urgent: false },
      { date: '2026-01-24', display: 'Sáb 24 Ene 2026', slots: 10, urgent: false }
    ]
  },
  {
    id: 'la-paila',
    name: 'Sendero La Paila',
    sector: 'Sector La Paila',
    difficulty: 'Fácil',
    duration: '1 Hora',
    distance: '1.8 km',
    elevationGain: '60m',
    maxAltitude: '3.080 m.s.n.m.',
    pricePerPerson: 120000,
    image: '/assets/60077.png',
    description: 'Paseo corto y accesible hacia una hermosa caldera natural con aguas termales y rica vegetación de piedemonte andino.',
    highlights: ['Sendero señalizado corto', 'Zonas de descanso', 'Accesible para movilidad reducida'],
    meetingPoint: 'Estación de Guardaparques La Paila',
    availableDates: [
      { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 15, urgent: false },
      { date: '2025-12-21', display: 'Dom 21 Dic 2025', slots: 12, urgent: false },
      { date: '2026-01-04', display: 'Dom 04 Ene 2026', slots: 14, urgent: false }
    ]
  },
  {
    id: 'bosque-de-niebla',
    name: 'Sendero Bosque de Niebla',
    sector: 'Sector Monterredondo',
    difficulty: 'Moderado',
    duration: '3 Horas',
    distance: '5.5 km',
    elevationGain: '310m',
    maxAltitude: '3.300 m.s.n.m.',
    pricePerPerson: 160000,
    image: '/assets/6701e.png',
    description: 'Inmersión en el bosque nublado donde la condensación crea un microclima de musgos colgantes, helechos arborescentes y aves multicolores.',
    highlights: ['Helechos arborescentes gigantes', 'Bosque nuboso primario', 'Fotografía de naturaleza'],
    meetingPoint: 'Km 22 Vía Monterredondo',
    availableDates: [
      { date: '2025-12-15', display: 'Dom 15 Dic 2025', slots: 8, urgent: false },
      { date: '2025-12-28', display: 'Dom 28 Dic 2025', slots: 5, urgent: false },
      { date: '2026-01-11', display: 'Dom 11 Ene 2026', slots: 9, urgent: false }
    ]
  }
];

export const SOLD_OUT_DEMO_TRAIL: Trail = {
  id: 'chorreras-sold-out',
  name: 'Sendero Chorreras (Capacidad Completa)',
  sector: 'Sector Monterredondo',
  difficulty: 'Exigente',
  duration: '8h',
  distance: '16km',
  elevationGain: '950m',
  maxAltitude: '3.700 m.s.n.m.',
  pricePerPerson: 225000,
  image: '/assets/9f525.png',
  description: 'Este sendero ha alcanzado el límite de carga biológica para preservar el ecosistema hídrico.',
  highlights: ['Cupo regulado por Parques Nacionales'],
  meetingPoint: 'Puesto de Control Monterredondo',
  soldOut: true,
  suggestedAltDates: ['Ene 18', 'Feb 01', 'Feb 15'],
  availableDates: []
};
