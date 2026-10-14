/**
 * Geometría del sendero de la ilustración: una curva suave (Catmull-Rom) que
 * pasa por puntos de control, muestreada para ubicar a la persona por la
 * distancia recorrida y no por el parámetro de la curva.
 */
export type Punto = readonly [number, number];

export interface PosicionSendero {
  x: number;
  y: number;
  /** Ángulo de la pendiente en grados. */
  angulo: number;
  /** 1 si avanza hacia la derecha, -1 si hacia la izquierda. */
  sentido: 1 | -1;
}

function catmullRom(p0: Punto, p1: Punto, p2: Punto, p3: Punto, t: number): [number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

export class Sendero {
  private readonly muestras: [number, number][] = [];
  private readonly acumulado: number[] = [];
  readonly largo: number;

  constructor(readonly control: readonly Punto[], muestrasPorTramo = 40) {
    const n = control.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = control[Math.max(0, i - 1)];
      const p3 = control[Math.min(n - 1, i + 2)];
      for (let k = 0; k < muestrasPorTramo; k++) this.muestras.push(catmullRom(p0, control[i], control[i + 1], p3, k / muestrasPorTramo));
    }
    this.muestras.push([control[n - 1][0], control[n - 1][1]]);
    let total = 0;
    this.acumulado.push(0);
    for (let i = 1; i < this.muestras.length; i++) {
      const [ax, ay] = this.muestras[i - 1];
      const [bx, by] = this.muestras[i];
      total += Math.hypot(bx - ax, by - ay);
      this.acumulado.push(total);
    }
    this.largo = total;
  }

  /** Posición a una fracción (0 a 1) de la longitud total. */
  en(fraccion: number): PosicionSendero {
    const objetivo = Math.min(1, Math.max(0, fraccion)) * this.largo;
    let bajo = 0;
    let alto = this.acumulado.length - 1;
    while (bajo < alto - 1) {
      const medio = (bajo + alto) >> 1;
      if (this.acumulado[medio] <= objetivo) bajo = medio;
      else alto = medio;
    }
    const tramo = this.acumulado[alto] - this.acumulado[bajo] || 1;
    const f = (objetivo - this.acumulado[bajo]) / tramo;
    const [ax, ay] = this.muestras[bajo];
    const [bx, by] = this.muestras[alto];
    const dx = bx - ax;
    const dy = by - ay;
    const sentido: 1 | -1 = dx >= 0 ? 1 : -1;
    return { x: ax + dx * f, y: ay + dy * f, angulo: (Math.atan2(dy, Math.abs(dx) || 0.001) * 180) / Math.PI, sentido };
  }

  /** Atributo `d` de SVG con la curva muestreada. */
  trazo(): string {
    return this.muestras.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  }
}

/** Generador pseudoaleatorio con semilla: el paisaje es igual en cada visita. */
export function aleatorio(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
