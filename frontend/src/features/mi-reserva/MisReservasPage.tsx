import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { atributosFoto, foto, MEDIA_PANTALLA } from '@/contenido/fotos';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Aparecer, FotoAnimada } from '@/ui/movimiento';

/** RF-36: el turista pide con su correo el enlace a su historial de reservas (sin cuenta). */
export function SolicitarHistorialPage() {
  const { reservas } = useServicios();
  const { t } = useIdioma();
  const { alt } = useContenido();
  const mensajeDeError = useMensajeError();
  const paisaje = foto('espeletias-laguna');
  const [correo, setCorreo] = useState('');
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'enviado' | { error: string }>('inicial');
  const m = t.misReservas;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      await reservas.solicitarHistorial(correo.trim());
      setEstado('enviado');
    } catch (err) {
      setEstado({ error: mensajeDeError(err) });
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-32 pb-16 sm:px-8 lg:grid-cols-2 lg:px-12">
      <Aparecer className="relative hidden h-[520px] overflow-hidden rounded-[40px] shadow-2xl lg:block">
        <FotoAnimada {...atributosFoto(paisaje, MEDIA_PANTALLA)} alt={alt(paisaje)} kenBurns />
        <div className="absolute inset-0 bg-gradient-to-t from-bosque/80 to-transparent" />
        <p className="absolute inset-x-8 bottom-8 m-0 font-display text-3xl font-extrabold text-white">{m.lema}</p>
      </Aparecer>
      <div className="flex max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="etiqueta text-tinta-suave">{m.etiqueta}</span>
          <h1 className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{m.titulo}</h1>
          <p className="m-0 text-[17px] leading-relaxed text-tinta">{m.texto}</p>
        </div>
        {estado === 'enviado' ? (
          <p role="status" className="m-0 border-t linea pt-6 text-lg">
            {m.enviado}
          </p>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-5">
            <Campo etiqueta={m.correo} type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            {typeof estado === 'object' && (
              <p role="alert" className="m-0 text-sm text-error">
                {estado.error}
              </p>
            )}
            <Boton type="submit" cargando={estado === 'enviando'}>
              {m.enviar}
            </Boton>
          </form>
        )}
      </div>
    </div>
  );
}

/** RF-36: historial de reservas del correo, abierto con el enlace que llegó al correo. */
export function MisReservasPage() {
  const { token = '' } = useParams();
  const { reservas } = useServicios();
  const { t, f } = useIdioma();
  const m = t.misReservas;
  const { estado, recargar } = useConsulta(() => reservas.historial(token), [reservas, token]);

  if (estado.tipo === 'cargando') return <div className="mx-auto max-w-7xl px-6 py-20"><Cargando texto={m.abriendo} /></div>;
  if (estado.tipo === 'error') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-20">
        <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />
        <Link to="/mis-reservas">{m.pedirNuevo}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 pt-32 pb-20 sm:px-8">
      <div className="flex flex-col gap-3">
        <span className="etiqueta text-tinta-suave">{m.etiqueta}</span>
        <h1 className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{m.historial}</h1>
      </div>
      {estado.datos.length === 0 ? (
        <p className="m-0 text-lg text-tinta">{m.vacio}</p>
      ) : (
        <ul aria-label={m.historial} className="m-0 flex list-none flex-col p-0">
          {estado.datos.map((r) => (
            <li key={r.codigo} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 border-t linea py-4">
              <span className="flex flex-col gap-0.5">
                <span className="font-display text-xl font-bold">{r.senderoNombre}</span>
                <span className="font-mono text-sm text-tinta-suave">
                  {r.codigo} · {f.fecha(r.fecha)} · {t.comun.personas(r.personas)}
                </span>
              </span>
              <span className="font-mono text-[13px] tracking-[0.08em] uppercase">{t.estados[r.estado]}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/mi-reserva">{m.gestionar}</Link>
    </div>
  );
}
