import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RUTA_PANEL } from '@/domain/equipo';
import { useServicios } from '@/services/ServiciosContext';
import { mensajeDeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Contornos } from '@/ui/Contornos';
import { Logo } from '@/ui/Logo';
import { useSesion } from './SesionContext';

const FUENTE_MEMORIA = import.meta.env.VITE_FUENTE_DATOS !== 'http';

export function AccesoPage() {
  const { autenticacion } = useServicios();
  const { sesion, abrir } = useSesion();
  const navegar = useNavigate();
  const desde = (useLocation().state as { desde?: string } | null)?.desde;
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (sesion) return <Navigate to={RUTA_PANEL[sesion.rol]} replace />;

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const nueva = await autenticacion.iniciarSesion(correo, clave);
      abrir(nueva);
      const destino = RUTA_PANEL[nueva.rol];
      navegar(desde?.startsWith(destino) ? desde : destino, { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-arena text-bosque lg:grid-cols-[5fr_6fr]">
      <div className="relative flex min-h-[220px] flex-col justify-between gap-8 overflow-hidden bg-bosque p-8 text-arena lg:p-12">
        <Contornos />
        <Link to="/" className="relative text-arena no-underline hover:text-arena">
          <Logo lema="Equipo" />
        </Link>
        <div className="relative flex max-w-[420px] flex-col gap-3.5">
          <span className="etiqueta text-salvia">Eco Palacio Tur S.A.S.</span>
          <p className="m-0 font-display text-3xl leading-[1.05] font-extrabold tracking-tight lg:text-[40px]">
            Operación del día, salida por salida.
          </p>
        </div>
      </div>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={ingresar} aria-labelledby="acceso-titulo" className="flex w-full max-w-[420px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 id="acceso-titulo" className="m-0 font-display text-[40px] font-extrabold tracking-tight">
              Ingresar
            </h1>
            <p className="m-0 text-[15px] leading-relaxed text-tinta">
              Solo para personal administrativo, guías y gerencia. Las cuentas las crea gerencia.
            </p>
          </div>
          <Campo etiqueta="Correo de trabajo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          <Campo
            etiqueta="Contraseña"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
            accesorio={
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
                className="h-10 bg-transparent px-3 font-mono text-[13px] text-pino"
              >
                {visible ? 'Ocultar' : 'Mostrar'}
              </button>
            }
          />
          {error && (
            <p role="alert" className="m-0 text-sm text-error">
              {error}
            </p>
          )}
          <Boton type="submit" cargando={enviando}>
            Ingresar
          </Boton>
          {FUENTE_MEMORIA && (
            <div className="flex flex-col gap-1.5 border-t linea pt-5 text-sm text-tinta">
              <span className="etiqueta text-[11px] text-tinta-suave">Cuentas de prueba (datos en memoria)</span>
              <span className="font-mono">admin@ · guia@ · gerencia@ecopalacio.co</span>
              <span className="font-mono">Contraseña: paramo2026</span>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
