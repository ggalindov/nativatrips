import type { Sendero } from '@/domain/sendero';

/** Catálogo de los 13 senderos que opera Eco Palacio Tur en el PNN Chingaza. */
export const SENDEROS: readonly Sendero[] = [
  { id: 'la-paila', nombre: 'La Paila', dificultad: 'Fácil', duracionHoras: 1, distanciaKm: 1.8, horaSalida: '09:30' },
  { id: 'laguna-seca', nombre: 'Laguna Seca', dificultad: 'Fácil', duracionHoras: 2, distanciaKm: 3.5, horaSalida: '09:00' },
  { id: 'la-arboleda', nombre: 'La Arboleda', dificultad: 'Fácil', duracionHoras: 2.5, distanciaKm: 4.2, horaSalida: '08:30' },
  { id: 'el-retiro', nombre: 'El Retiro', dificultad: 'Fácil', duracionHoras: 3, distanciaKm: 5.5, horaSalida: '08:30' },
  { id: 'bosque-de-niebla', nombre: 'Bosque de Niebla', dificultad: 'Moderado', duracionHoras: 3, distanciaKm: 5.5, horaSalida: '08:00' },
  { id: 'monterredondo', nombre: 'Monterredondo', dificultad: 'Moderado', duracionHoras: 3.5, distanciaKm: 7, horaSalida: '08:00' },
  { id: 'suasie', nombre: 'Suasie', dificultad: 'Moderado', duracionHoras: 4, distanciaKm: 8.5, horaSalida: '07:30' },
  { id: 'rio-la-playa', nombre: 'Río La Playa', dificultad: 'Moderado', duracionHoras: 4, distanciaKm: 8, horaSalida: '07:30' },
  { id: 'los-caquezas', nombre: 'Los Cáquezas', dificultad: 'Moderado', duracionHoras: 4.5, distanciaKm: 9.2, horaSalida: '07:00' },
  { id: 'lagunas-de-siecha', nombre: 'Lagunas de Siecha', dificultad: 'Moderado', duracionHoras: 5, distanciaKm: 10, horaSalida: '07:00' },
  { id: 'piedras-gordas', nombre: 'Piedras Gordas', dificultad: 'Difícil', duracionHoras: 5.5, distanciaKm: 11, horaSalida: '07:00' },
  { id: 'cuchilla-el-zaque', nombre: 'Cuchilla el Zaque', dificultad: 'Exigente', duracionHoras: 6, distanciaKm: 13.5, horaSalida: '06:30' },
  { id: 'chorreras', nombre: 'Chorreras', dificultad: 'Exigente', duracionHoras: 8, distanciaKm: 16, horaSalida: '06:30' },
];

/** Cuentas del equipo disponibles solo con la fuente de datos en memoria. */
export const CUENTAS_DEMO = [
  { correo: 'admin@ecopalacio.co', nombre: 'Andrea Ruiz', rol: 'PERSONAL_ADMINISTRATIVO' },
  { correo: 'guia@ecopalacio.co', nombre: 'Marta León', rol: 'GUIA_TURISTICO' },
  { correo: 'gerencia@ecopalacio.co', nombre: 'Carlos Palacio', rol: 'GERENCIA' },
] as const;

export const CLAVE_DEMO = 'paramo2026';
