import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { atributosFoto, foto, MEDIA_PANTALLA } from '@/contenido/fotos';
import { LARGO_MINIMO_CLAVE } from '@/domain/equipo';
import { useServicios } from '@/services/ServiciosContext';
import { ErrorServicio } from '@/services/puertos';
import { useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Contornos } from '@/ui/Contornos';
import { Logo } from '@/ui/Logo';
import { FotoAnimada } from '@/ui/movimiento';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Recuperación de acceso del personal (RF-34). Sin token pide el enlace por correo;
 * con el token del enlace (`?token=`) crea la contraseña nueva.
 */
export function RecuperarPage() {
  const [parametros] = useSearchParams();
  const navegar = useNavigate();
  // El token se guarda al entrar y se quita de la barra de direcciones: no queda en el historial.
  const [token] = useState(() => parametros.get('token'));
  useEffect(() => {
    if (parametros.has('token')) navegar('/equipo/recuperar', { replace: true });
  }, [parametros, navegar]);

  return (
    <div className="grid min-h-screen bg-arena text-bosque lg:grid-cols-[5fr_6fr]">
      <div className="relative flex min-h-[200px] flex-col justify-between gap-8 overflow-hidden bg-bosque p-8 text-arena lg:p-12">
        <div className="absolute inset-0">
          <FotoAnimada {...atributosFoto(foto('camino-niebla'), MEDIA_PANTALLA)} alt="" kenBurns prioridad />
          <div className="absolute inset-0 bg-gradient-to-t from-bosque via-bosque/70 to-bosque/40" />
        </div>
        <Contornos />
        <Link to="/" className="relative text-arena no-underline hover:text-arena">
          <Logo lema="Equipo" />
        </Link>
        <p className="relative m-0 max-w-[420px] font-display text-3xl leading-[1.05] font-extrabold tracking-tight lg:text-[40px]">Volvamos al sendero.</p>
      </div>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-6">{token ? <NuevaClave token={token} /> : <PedirEnlace />}</div>
      </main>
    </div>
  );
}

function Confirmacion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <motion.div role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-3xl bg-superficie p-6 shadow-[var(--shadow-tarjeta)]">
      <span className="flex size-12 items-center justify-center rounded-full bg-lima text-xl font-black">✓</span>
      <span className="font-display text-xl font-bold">{titulo}</span>
      <span className="text-[15px] text-tinta">{children}</span>
    </motion.div>
  );
}

/** Siempre la misma respuesta, para no revelar qué correos existen. */
function PedirEnlace() {
  const { autenticacion } = useServicios();
  const mensajeDeError = useMensajeError();
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!CORREO.test(correo.trim())) {
      setError('Escribe un correo válido.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await autenticacion.solicitarRecuperacion(correo.trim());
      setEnviado(true);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[40px] leading-none font-extrabold tracking-tight">Recuperar acceso</h1>
        <p className="m-0 text-[15px] leading-relaxed text-tinta">Escribe tu correo de trabajo y te enviaremos un enlace para crear una contraseña nueva. El enlace vence en 30 minutos.</p>
      </div>
      {enviado ? (
        <Confirmacion titulo="Revisa tu correo">
          Si {correo.trim()} pertenece a una cuenta del equipo, en unos minutos recibirás el enlace. Revisa también la carpeta de spam.
        </Confirmacion>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
          <Campo etiqueta="Correo de trabajo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error ?? undefined} />
          <Boton type="submit" cargando={enviando}>
            Enviarme el enlace
          </Boton>
        </form>
      )}
      <Link to="/equipo/acceso" className="text-sm font-semibold">
        ← Volver a ingresar
      </Link>
    </>
  );
}

function NuevaClave({ token }: { token: string }) {
  const { autenticacion } = useServicios();
  const mensajeDeError = useMensajeError();
  const [clave, setClave] = useState('');
  const [repetida, setRepetida] = useState('');
  const [errorClave, setErrorClave] = useState<string | null>(null);
  const [errorRepetida, setErrorRepetida] = useState<string | null>(null);
  const [error, setError] = useState<{ texto: string; enlaceVencido: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState(false);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const corta = clave.length < LARGO_MINIMO_CLAVE;
    const distinta = clave !== repetida;
    setErrorClave(corta ? `Usa al menos ${LARGO_MINIMO_CLAVE} caracteres.` : null);
    setErrorRepetida(!corta && distinta ? 'Las contraseñas no coinciden.' : null);
    if (corta || distinta) return;
    setError(null);
    setEnviando(true);
    try {
      await autenticacion.restablecerClave(token, clave);
      setLista(true);
    } catch (err) {
      setError({
        texto: mensajeDeError(err),
        enlaceVencido: err instanceof ErrorServicio && err.codigo === 'enlaceRecuperacionVencido',
      });
    } finally {
      setEnviando(false);
    }
  };

  if (lista) {
    return (
      <>
        <Confirmacion titulo="Contraseña actualizada">Ya puedes ingresar con tu contraseña nueva. El enlace dejó de servir.</Confirmacion>
        <Link to="/equipo/acceso" className="text-sm font-semibold">
          Ingresar →
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[40px] leading-none font-extrabold tracking-tight">Contraseña nueva</h1>
        <p className="m-0 text-[15px] leading-relaxed text-tinta">Elige una contraseña de al menos {LARGO_MINIMO_CLAVE} caracteres que no uses en otro sitio.</p>
      </div>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-6">
        <Campo etiqueta="Contraseña nueva" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} error={errorClave ?? undefined} />
        <Campo etiqueta="Repite la contraseña" type="password" autoComplete="new-password" value={repetida} onChange={(e) => setRepetida(e.target.value)} error={errorRepetida ?? undefined} />
        {error && (
          <p role="alert" className="m-0 text-sm text-error">
            {error.texto}{' '}
            {error.enlaceVencido && (
              <Link to="/equipo/recuperar" reloadDocument className="font-semibold">
                Pedir otro enlace
              </Link>
            )}
          </p>
        )}
        <Boton type="submit" cargando={enviando}>
          Guardar contraseña
        </Boton>
      </form>
      <Link to="/equipo/acceso" className="text-sm font-semibold">
        ← Volver a ingresar
      </Link>
    </>
  );
}
