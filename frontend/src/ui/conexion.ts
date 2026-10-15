interface InformacionRed {
  saveData?: boolean;
  effectiveType?: string;
}

function red(): InformacionRed | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: InformacionRed }).connection;
}

/**
 * La persona activó el ahorro de datos o el navegador estima una conexión 2G.
 * Solo Chrome y Edge lo informan; en los demás navegadores se asume que no.
 */
export function conexionLimitada(): boolean {
  const r = red();
  return r?.saveData === true || r?.effectiveType === '2g' || r?.effectiveType === 'slow-2g';
}

/** Pantallas angostas reciben medios en menor resolución. */
export function pantallaPequena(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches === true;
}
