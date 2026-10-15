/**
 * Dónde está la reserva. Las coordenadas son las de la ficha "Reserva
 * Ecopalacio Chingaza" en Google Maps (Plus Code P5J7+X6 Guasca).
 */
export const RESERVA = {
  nombre: 'Reserva Ecopalacio Chingaza',
  direccion: ['Finca Palacio, Vereda Trinidad vía La Calera', 'Parque Chingaza, sector Piedras Gordas', 'Vda. La Trinidad, Guasca, Cundinamarca'],
  latitud: 4.7324372,
  longitud: -73.8369286,
  plusCode: 'P5J7+X6 Guasca, Cundinamarca',
} as const;

const coordenadas = `${RESERVA.latitud},${RESERVA.longitud}`;

/** Abre Waze con la ruta lista para salir. */
export function enlaceWaze(): string {
  return `https://waze.com/ul?ll=${coordenadas}&navigate=yes`;
}

/** Abre Google Maps con la indicación hasta la reserva desde la ubicación actual. */
export function enlaceGoogleMaps(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${coordenadas}&travelmode=driving`;
}

/** Mapa embebible de Google, sin llave, con la etiqueta del idioma del sitio. */
export function mapaEmbebido(idioma: string): string {
  const consulta = encodeURIComponent(`${RESERVA.nombre} @${coordenadas}`);
  return `https://maps.google.com/maps?q=${consulta}&ll=${coordenadas}&z=14&hl=${idioma}&output=embed`;
}
