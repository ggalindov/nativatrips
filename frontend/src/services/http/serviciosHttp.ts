import type { Dificultad, Sendero } from '@/domain/sendero';
import { esRolEquipo } from '@/domain/equipo';
import { sumarDias } from '@/domain/fechas';
import { cargarBiblioteca } from '../biblioteca/cargarBiblioteca';
import { ErrorServicio } from '../puertos';
import type { Servicios } from '../puertos';

interface SenderoApi {
  id: number;
  nombre: string;
  nivelDificultad: 'FACIL' | 'MODERADO' | 'DIFICIL';
  duracionMinutos: number;
  descripcion: string | null;
  precio: number | null;
}

interface DisponibilidadApi {
  fecha: string;
  cupoMaximoDia: number;
  ocupacionActual: number;
}

interface LoginApi {
  accessToken: string;
  usuario: { email: string; nombreCompleto: string; rol: string };
}

const DIFICULTAD: Record<SenderoApi['nivelDificultad'], Dificultad> = {
  FACIL: 'Fácil',
  MODERADO: 'Moderado',
  DIFICIL: 'Difícil',
};

function aSendero(s: SenderoApi): Sendero {
  return {
    id: String(s.id),
    nombre: s.nombre,
    dificultad: DIFICULTAD[s.nivelDificultad],
    duracionHoras: s.duracionMinutos / 60,
    distanciaKm: null,
    horaSalida: '07:00',
    sector: null,
    desnivelM: null,
    altitudMaxM: null,
    precioPorPersona: s.precio,
    descripcion: s.descripcion ?? '',
    destacados: [],
    puntoEncuentro: null,
  };
}

/**
 * Adaptador contra la API REST del backend. Las operaciones de reserva por
 * enlace y los paneles dependen de endpoints definidos en el ADR-004 que el
 * backend aún no expone; mientras tanto responden con un error explícito.
 */
export function crearServiciosHttp(baseUrl: string): Servicios {
  async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${baseUrl}${ruta}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
    } catch {
      throw new ErrorServicio('No hay conexión con el servidor. Intenta de nuevo en un momento.');
    }
    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as { message?: string } | null;
      throw new ErrorServicio(cuerpo?.message ?? `El servidor respondió ${respuesta.status}.`);
    }
    return (await respuesta.json()) as T;
  }

  const pendiente = (): never => {
    throw new ErrorServicio('Esta función estará disponible cuando el backend implemente las reservas por enlace (ADR-004).');
  };

  return {
    senderos: {
      listar: async () => (await pedir<SenderoApi[]>('/api/v1/senderos')).map(aSendero),
      obtener: async (id) => aSendero(await pedir<SenderoApi>(`/api/v1/senderos/${encodeURIComponent(id)}`)),
      disponibilidad: async (id, desde, dias) =>
        Promise.all(
          Array.from({ length: dias }, async (_, i) => {
            const fecha = sumarDias(desde, i);
            const d = await pedir<DisponibilidadApi>(
              `/api/v1/senderos/${encodeURIComponent(id)}/disponibilidad?fecha=${fecha}`,
            );
            return { fecha, limite: d.cupoMaximoDia, ocupados: d.ocupacionActual };
          }),
        ),
    },
    reservas: {
      crear: async () => pendiente(),
      abrirConEnlace: async () => pendiente(),
      solicitarEnlace: async () => pendiente(),
      agregarAcompanante: async () => pendiente(),
      cancelar: async () => pendiente(),
    },
    operacion: {
      enRevision: async () => pendiente(),
      resolverRevision: async () => pendiente(),
      salidasDelDia: async () => pendiente(),
      ocupacion: async () => pendiente(),
      salidaDelGuia: async () => pendiente(),
      marcarAsistencia: async () => pendiente(),
      resumenGerencia: async () => pendiente(),
    },
    biblioteca: { listar: cargarBiblioteca },
    autenticacion: {
      iniciarSesion: async (correo, clave) => {
        const r = await pedir<LoginApi>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: correo, password: clave }),
        });
        if (!esRolEquipo(r.usuario.rol)) throw new ErrorServicio('Esta cuenta no pertenece al equipo.');
        return { nombre: r.usuario.nombreCompleto, correo: r.usuario.email, rol: r.usuario.rol, token: r.accessToken };
      },
    },
  };
}
