import { motion } from 'motion/react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { fotoDeSendero } from '@/contenido/fotos';
import type { Diccionario } from '@/i18n/diccionarios/es';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { EnlaceBoton } from '@/ui/Boton';
import { Aparecer, CURVA } from '@/ui/movimiento';

interface EstadoNavegacion {
  codigo: string;
  correo: string;
  titular?: string;
  senderoId?: string;
  senderoNombre?: string;
  fecha?: string;
  personas?: number;
  total?: number | null;
  horaSalida?: string;
  puntoEncuentro?: string | null;
  enlaceDesarrollo?: string;
}

/** Patrón decorativo tipo QR derivado del código: identifica visualmente el comprobante. */
function PatronCodigo({ codigo, etiqueta }: { codigo: string; etiqueta: string }) {
  const n = 13;
  let h = 7;
  for (const c of codigo) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const celdas: [number, number][] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const esquina = (x < 4 && y < 4) || (x > n - 5 && y < 4) || (x < 4 && y > n - 5);
      h = (h * 1103515245 + 12345) >>> 0;
      if (!esquina && (h >>> 16) % 2 === 0) celdas.push([x, y]);
    }
  }
  const marco = (x: number, y: number) => (
    <g key={`m-${x}-${y}`}>
      <rect x={x} y={y} width="3.4" height="3.4" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <rect x={x + 1.1} y={y + 1.1} width="1.2" height="1.2" fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-0.5 -0.5 ${n + 1} ${n + 1}`} className="size-32 text-bosque" role="img" aria-label={etiqueta}>
      {celdas.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.1} y={y + 0.1} width="0.8" height="0.8" rx="0.15" fill="currentColor" />
      ))}
      {marco(0, 0)}
      {marco(n - 3.4, 0)}
      {marco(0, n - 3.4)}
    </svg>
  );
}

function enlaceCalendario(e: EstadoNavegacion, t: Diccionario): string | null {
  if (!e.fecha) return null;
  const dia = e.fecha.replace(/-/g, '');
  const hora = (e.horaSalida ?? '07:00').replace(':', '') + '00';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `NativaTrips · ${e.senderoNombre ?? t.reserva.sendero} (${e.codigo})`,
    dates: `${dia}T${hora}/${dia}T${hora}`,
    details: t.apartada.detalleCalendario(e.codigo, e.puntoEncuentro ?? t.apartada.porConfirmar),
    location: e.puntoEncuentro ?? 'PNN Chingaza',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function ReservaApartadaPage() {
  const estado = useLocation().state as EstadoNavegacion | null;
  const { t, f: formato } = useIdioma();
  const c = useContenido();
  if (!estado?.codigo) return <Navigate to="/reservar" replace />;

  const f = fotoDeSendero(estado.senderoId ?? '');
  const calendario = enlaceCalendario(estado, t);
  const mensaje = encodeURIComponent(t.apartada.mensajeWhatsapp(estado.senderoNombre ?? t.apartada.unSendero, estado.codigo));
  const a = t.apartada;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-32 pb-14 sm:px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          className="flex size-20 items-center justify-center rounded-full bg-lima shadow-xl"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="var(--color-bosque)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5 10 17 19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: CURVA }} />
          </svg>
        </motion.div>
        <Aparecer>
          <span className="font-mono text-sm text-tinta-suave">{a.reserva(estado.codigo)}</span>
          <h1 className="m-0 mt-2 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{a.titulo}</h1>
        </Aparecer>
        <Aparecer retraso={0.1}>
          <p className="m-0 max-w-2xl text-lg leading-relaxed text-tinta">
            {a.enviamosAntes} <strong className="font-semibold text-bosque">{estado.correo}</strong> {a.enviamosDespues}
          </p>
        </Aparecer>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: CURVA, delay: 0.2 }}
        className="grid overflow-hidden rounded-[32px] bg-superficie shadow-2xl md:grid-cols-[1fr_auto]"
        aria-label={a.comprobante}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between bg-bosque px-7 py-4 text-white">
            <span className="font-display text-lg font-extrabold">{a.pase}</span>
            <span className="rounded-full bg-lima/20 px-3 py-1 text-xs font-bold text-lima">{a.pendientePago}</span>
          </div>
          <div className="relative h-40">
            <img src={f.srcPequena} alt={c.alt(f)} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bosque/80 to-transparent" />
            <h2 className="absolute bottom-4 left-7 m-0 font-display text-3xl font-extrabold text-white">{estado.senderoNombre}</h2>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-5 p-7 sm:grid-cols-4">
            {[
              [a.fecha, estado.fecha ? formato.fecha(estado.fecha) : '—'],
              [a.salida, estado.horaSalida ?? '—'],
              [a.personas, String(estado.personas ?? 1)],
              [a.total, c.pesos(estado.total ?? null)],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse gap-1">
                <dt className="etiqueta text-tinta-suave">{k}</dt>
                <dd className="m-0 font-display text-lg font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mx-7 mb-7 rounded-2xl bg-arena p-4 text-sm">
            <span className="font-bold">{a.puntoEncuentro} </span>
            {estado.puntoEncuentro ?? a.seConfirmaCorreo}
          </div>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-3 border-t-2 border-dashed border-bosque/20 bg-arena px-8 py-8 md:border-t-0 md:border-l-2">
          <span className="etiqueta text-tinta-suave">{a.codigo}</span>
          <span className="font-cifras text-2xl font-black">{estado.codigo}</span>
          <PatronCodigo codigo={estado.codigo} etiqueta={a.codigoVisual(estado.codigo)} />
          {estado.titular && <span className="text-xs text-tinta-suave">{estado.titular}</span>}
        </div>
      </motion.article>

      <Aparecer className="flex flex-wrap justify-center gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-full bg-bosque px-5 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-bosque-2">
          {a.imprimir}
        </button>
        <a href={`https://wa.me/?text=${mensaje}`} target="_blank" rel="noreferrer" className="rounded-full border border-bosque/20 px-5 py-3 font-display text-sm font-bold text-bosque no-underline hover:bg-bosque hover:text-white">
          {a.whatsapp}
        </a>
        {calendario && (
          <a href={calendario} target="_blank" rel="noreferrer" className="rounded-full border border-bosque/20 px-5 py-3 font-display text-sm font-bold text-bosque no-underline hover:bg-bosque hover:text-white">
            {a.calendario}
          </a>
        )}
      </Aparecer>

      <Aparecer className="rounded-[32px] bg-bosque p-8 text-white md:p-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="etiqueta text-lima">{a.siguientePaso}</span>
            <span className="font-display text-2xl font-extrabold">{a.prepara}</span>
          </div>
          <EnlaceBoton to="/antes-de-subir" conFlecha>
            {a.irGuia}
          </EnlaceBoton>
        </div>
      </Aparecer>

      <p className="m-0 text-center text-base text-tinta">
        {a.noLlegoAntes} <Link to="/mi-reserva">{t.nav.enlaces.miReserva.texto}</Link> {a.noLlegoDespues}
      </p>
      {estado.enlaceDesarrollo && (
        <div className="flex flex-col items-center gap-2 border-t linea pt-6">
          <span className="etiqueta text-tinta-suave">{a.soloDesarrollo}</span>
          <Link to={estado.enlaceDesarrollo}>{a.abrirEnlace}</Link>
        </div>
      )}
    </div>
  );
}
