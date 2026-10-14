import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hoyIso } from '@/domain/fechas';
import type { Visitante } from '@/services/puertos';
import { useServicios } from '@/services/ServiciosContext';
import { useConsulta, useMensajeError } from '@/services/useConsulta';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { useSesion } from '../SesionContext';

/** Panel móvil del guía: pasar lista en el punto de encuentro. */
export function PanelGuia() {
  const mensajeDeError = useMensajeError();
  const { operacion } = useServicios();
  const { sesion, cerrar } = useSesion();
  const navegar = useNavigate();
  const hoy = useMemo(() => hoyIso(), []);
  const salida = useConsulta(() => operacion.salidaDelGuia(hoy), [operacion, hoy]);
  const [cambios, setCambios] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const presente = (v: Visitante) => cambios[v.id] ?? v.presente;

  const alternar = async (v: Visitante) => {
    const nuevo = !presente(v);
    setCambios((c) => ({ ...c, [v.id]: nuevo }));
    try {
      await operacion.marcarAsistencia(v.id, nuevo);
    } catch (err) {
      setCambios((c) => ({ ...c, [v.id]: !nuevo }));
      setError(mensajeDeError(err));
    }
  };

  const salir = () => {
    cerrar();
    navegar('/equipo/acceso', { replace: true });
  };

  if (salida.estado.tipo === 'cargando') return <div className="p-6"><Cargando /></div>;
  if (salida.estado.tipo === 'error') return <div className="p-6"><ErrorCarga mensaje={salida.estado.mensaje} reintentar={salida.recargar} /></div>;
  const s = salida.estado.datos;

  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-arena text-bosque">
      <header className="flex flex-col gap-3.5 bg-bosque px-4 pt-5 pb-6 text-arena">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs tracking-[0.12em] text-salvia uppercase">Guía · {sesion?.nombre}</span>
          <button type="button" onClick={salir} className="min-h-11 bg-transparent px-2 text-sm text-salvia-clara underline">
            Salir
          </button>
        </div>
        {s ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[15px] text-lima">{s.hora} · hoy</span>
              <h1 className="m-0 font-display text-3xl leading-[1.05] font-extrabold tracking-tight">{s.senderoNombre}</h1>
            </div>
            <Asistencia presentes={s.visitantes.filter(presente).length} total={s.total} />
          </>
        ) : (
          <h1 className="m-0 font-display text-3xl font-extrabold">Hoy no tienes salidas asignadas.</h1>
        )}
      </header>

      {s && (
        <>
          <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
            <h2 className="m-0 text-base font-semibold">Lista del grupo</h2>
            <span className="font-mono text-xs text-tinta-suave">Toca para marcar</span>
          </div>
          {error && (
            <p role="alert" className="m-0 px-4 pb-2 text-sm text-error">
              {error}
            </p>
          )}
          <ul className="m-0 flex-1 list-none p-0">
            {s.visitantes.map((v) => {
              const ok = presente(v);
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    aria-pressed={ok}
                    onClick={() => alternar(v)}
                    className="flex min-h-[60px] w-full items-center justify-between gap-3 border-t linea bg-transparent px-4 text-left text-bosque"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-base font-medium">{v.nombre}</span>
                      <span className="font-mono text-xs text-tinta-suave">{v.nota}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-2xl border-[1.5px] ${
                        ok ? 'border-lima bg-lima text-bosque' : 'border-bosque/40 text-transparent'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5 6.5 12 13 4.5" />
                      </svg>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <footer className="sticky bottom-0 grid grid-cols-2 gap-2 border-t linea bg-superficie px-4 pt-3 pb-5">
            <button type="button" className="h-12 rounded-full border border-bosque bg-transparent font-semibold text-bosque">
              Reportar novedad
            </button>
            <a href="tel:[TELEFONO-EMERGENCIA]" className="flex h-[52px] items-center justify-center rounded-2xl bg-error font-semibold text-white no-underline hover:text-white">
              Emergencia
            </a>
          </footer>
        </>
      )}
    </div>
  );
}

function Asistencia({ presentes, total }: { presentes: number; total: number }) {
  const pct = total > 0 ? Math.round((presentes / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>Asistencia</span>
        <span className="font-mono" data-testid="asistencia">
          {presentes}/{total}
        </span>
      </div>
      <div role="img" aria-label={`${presentes} de ${total} presentes`} className="h-1.5 bg-arena/20">
        <div className="h-1.5 bg-lima transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
