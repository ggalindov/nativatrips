/**
 * Secuencia de cuadros del video del páramo para la portada. Los cuadros se
 * generan con `scripts/preparar-medios.sh` y se describen en manifest.json.
 */
export interface Manifiesto {
  total: number;
  ancho: number;
  alto: number;
  fps: number;
}

export const RUTA_SECUENCIA = '/media/descenso';

export function urlCuadro(indice: number): string {
  return `${RUTA_SECUENCIA}/${String(indice + 1).padStart(4, '0')}.webp`;
}

/**
 * Orden de descarga por refinamiento: el primer cuadro, luego uno de cada 16,
 * de cada 8, 4, 2 y por último todos. Así el scroll funciona desde el inicio y
 * gana fluidez a medida que llegan los demás cuadros.
 */
export function ordenDeCarga(total: number): number[] {
  const orden: number[] = [];
  const vistos = new Set<number>();
  const agregar = (i: number) => {
    if (i >= 0 && i < total && !vistos.has(i)) {
      vistos.add(i);
      orden.push(i);
    }
  };
  // Primero los extremos: el inicio y el final del recorrido.
  agregar(0);
  agregar(total - 1);
  for (const paso of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < total; i += paso) agregar(i);
  }
  return orden;
}

/** Cuadro cargado más cercano al pedido, buscando hacia ambos lados. */
export function cuadroCercano(pedido: number, cargados: ArrayLike<unknown>, total: number): number {
  if (cargados[pedido]) return pedido;
  for (let d = 1; d < total; d++) {
    if (pedido - d >= 0 && cargados[pedido - d]) return pedido - d;
    if (pedido + d < total && cargados[pedido + d]) return pedido + d;
  }
  return -1;
}

type Oyente = (cargados: number, total: number) => void;

/** Descarga los cuadros con concurrencia limitada y avisa el avance. Una sola instancia por página. */
export class CargadorSecuencia {
  readonly imagenes: (HTMLImageElement | undefined)[] = [];
  private oyentes = new Set<Oyente>();
  private cargados = 0;
  manifiesto: Manifiesto | null = null;
  private iniciado = false;

  constructor(private readonly concurrencia = 6) {}

  async iniciar(): Promise<void> {
    if (this.iniciado) return;
    this.iniciado = true;
    const respuesta = await fetch(`${RUTA_SECUENCIA}/manifest.json`);
    if (!respuesta.ok) throw new Error('No hay secuencia de cuadros');
    this.manifiesto = (await respuesta.json()) as Manifiesto;
    const cola = ordenDeCarga(this.manifiesto.total);
    const trabajador = async () => {
      for (let i = cola.shift(); i !== undefined; i = cola.shift()) await this.cargar(i);
    };
    await Promise.all(Array.from({ length: this.concurrencia }, trabajador));
  }

  private cargar(i: number): Promise<void> {
    return new Promise((resolver) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.imagenes[i] = img;
        this.cargados++;
        this.avisar();
        resolver();
      };
      img.onerror = () => resolver();
      img.src = urlCuadro(i);
    });
  }

  private avisar() {
    const total = this.manifiesto?.total ?? 0;
    this.oyentes.forEach((o) => o(this.cargados, total));
  }

  escuchar(oyente: Oyente): () => void {
    this.oyentes.add(oyente);
    oyente(this.cargados, this.manifiesto?.total ?? 0);
    return () => this.oyentes.delete(oyente);
  }
}

let instancia: CargadorSecuencia | null = null;

export function cargadorSecuencia(): CargadorSecuencia {
  instancia ??= new CargadorSecuencia();
  return instancia;
}
