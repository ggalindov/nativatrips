import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { atributosFoto, foto, MEDIA_PANTALLA } from '@/contenido/fotos';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Contornos } from '@/ui/Contornos';
import { Logo } from '@/ui/Logo';
import { FotoAnimada } from '@/ui/movimiento';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Recuperación de acceso del personal (RF-34): siempre la misma respuesta, para no revelar qué correos existen. */
export function RecuperarPage() {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!CORREO.test(correo.trim())) {
      setError('Escribe un correo válido.');
      return;
    }
    setError(null);
    setEnviado(true);
  };

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
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-display text-[40px] leading-none font-extrabold tracking-tight">Recuperar acceso</h1>
            <p className="m-0 text-[15px] leading-relaxed text-tinta">Escribe tu correo de trabajo y te enviaremos un enlace para crear una contraseña nueva. El enlace vence en 30 minutos.</p>
          </div>
          {enviado ? (
            <motion.div role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 rounded-3xl bg-superficie p-6 shadow-[var(--shadow-tarjeta)]">
              <span className="flex size-12 items-center justify-center rounded-full bg-lima text-xl font-black">✓</span>
              <span className="font-display text-xl font-bold">Revisa tu correo</span>
              <span className="text-[15px] text-tinta">Si {correo.trim()} pertenece a una cuenta del equipo, en unos minutos recibirás el enlace. Revisa también la carpeta de spam.</span>
            </motion.div>
          ) : (
            <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
              <Campo etiqueta="Correo de trabajo" type="email" autoComplete="username" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error ?? undefined} />
              <Boton type="submit">Enviarme el enlace</Boton>
            </form>
          )}
          <Link to="/equipo/acceso" className="text-sm font-semibold">
            ← Volver a ingresar
          </Link>
        </div>
      </main>
    </div>
  );
}
