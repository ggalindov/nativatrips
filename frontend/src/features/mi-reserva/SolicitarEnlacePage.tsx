import { useState } from 'react';
import type { FormEvent } from 'react';
import { useServicios } from '@/services/ServiciosContext';
import { mensajeDeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { foto } from '@/contenido/fotos';
import { Aparecer, FotoAnimada } from '@/ui/movimiento';

export function SolicitarEnlacePage() {
  const { reservas } = useServicios();
  const [codigo, setCodigo] = useState('');
  const [correo, setCorreo] = useState('');
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'enviado' | { error: string }>('inicial');

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEstado('enviando');
    try {
      await reservas.solicitarEnlace(codigo.trim().toUpperCase(), correo.trim());
      setEstado('enviado');
    } catch (err) {
      setEstado({ error: mensajeDeError(err) });
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:px-12">
      <Aparecer className="relative hidden h-[560px] overflow-hidden rounded-[40px] shadow-2xl lg:block">
        <FotoAnimada src={foto('laguna-chingaza').src} alt={foto('laguna-chingaza').alt} kenBurns />
        <div className="absolute inset-0 bg-gradient-to-t from-bosque/80 to-transparent" />
        <p className="absolute inset-x-8 bottom-8 m-0 font-display text-3xl font-extrabold text-white">Tu reserva, a un enlace de distancia.</p>
      </Aparecer>
    <div className="flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="etiqueta text-tinta-suave">Mi reserva</span>
        <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight">Te enviamos un enlace.</h1>
        <p className="m-0 text-[17px] leading-relaxed text-tinta">
          Escribe el código de tu reserva y el correo con el que la hiciste. El enlace sirve una sola vez y no necesitas
          contraseña.
        </p>
      </div>

      {estado === 'enviado' ? (
        <p role="status" className="m-0 border-t linea pt-6 text-lg">
          Si el código y el correo coinciden, en unos minutos te llegará el enlace. Revisa también la carpeta de spam.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-5">
          <Campo etiqueta="Código de reserva" placeholder="NT-7Q4K" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Campo etiqueta="Correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          {typeof estado === 'object' && (
            <p role="alert" className="m-0 text-sm text-error">
              {estado.error}
            </p>
          )}
          <Boton type="submit" cargando={estado === 'enviando'}>
            Enviarme el enlace
          </Boton>
        </form>
      )}
    </div>
    </div>
  );
}
