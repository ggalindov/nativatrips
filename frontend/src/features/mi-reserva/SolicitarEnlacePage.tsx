import { useState } from 'react';
import type { FormEvent } from 'react';
import { useServicios } from '@/services/ServiciosContext';
import { useIdioma } from '@/i18n/IdiomaContext';
import { useContenido } from '@/i18n/useContenido';
import { useMensajeError } from '@/services/useConsulta';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { atributosFoto, foto, MEDIA_PANTALLA } from '@/contenido/fotos';
import { Aparecer, FotoAnimada } from '@/ui/movimiento';

export function SolicitarEnlacePage() {
  const { reservas } = useServicios();
  const { t } = useIdioma();
  const { alt } = useContenido();
  const mensajeDeError = useMensajeError();
  const laguna = foto('laguna-chingaza');
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
    <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-32 pb-16 sm:px-8 lg:grid-cols-2 lg:px-12">
      <Aparecer className="relative hidden h-[560px] overflow-hidden rounded-[40px] shadow-2xl lg:block">
        <FotoAnimada {...atributosFoto(laguna, MEDIA_PANTALLA)} alt={alt(laguna)} kenBurns />
        <div className="absolute inset-0 bg-gradient-to-t from-bosque/80 to-transparent" />
        <p className="absolute inset-x-8 bottom-8 m-0 font-display text-3xl font-extrabold text-white">{t.solicitar.lema}</p>
      </Aparecer>
    <div className="flex max-w-xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="etiqueta text-tinta-suave">{t.solicitar.etiqueta}</span>
        <h1 className="m-0 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{t.solicitar.titulo}</h1>
        <p className="m-0 text-[17px] leading-relaxed text-tinta">
          {t.solicitar.texto}
        </p>
      </div>

      {estado === 'enviado' ? (
        <p role="status" className="m-0 border-t linea pt-6 text-lg">
          {t.solicitar.enviado}
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-5">
          <Campo etiqueta={t.solicitar.codigo} placeholder="NT-7Q4K" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
          <Campo etiqueta={t.solicitar.correo} type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          {typeof estado === 'object' && (
            <p role="alert" className="m-0 text-sm text-error">
              {estado.error}
            </p>
          )}
          <Boton type="submit" cargando={estado === 'enviando'}>
            {t.solicitar.enviar}
          </Boton>
        </form>
      )}
    </div>
    </div>
  );
}
