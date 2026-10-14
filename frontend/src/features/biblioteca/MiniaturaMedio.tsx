import { useRef } from 'react';
import type { ElementoBiblioteca } from '@/domain/biblioteca';
import { useContenido } from '@/i18n/useContenido';

/** Miniatura de foto o video; el video se reproduce en silencio al pasar el mouse. */
export function MiniaturaMedio({ medio, className = '' }: { medio: ElementoBiblioteca; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const { altMedio } = useContenido();
  if (medio.tipo === 'video') {
    return (
      <div className={`relative h-full w-full ${className}`}>
        <video
          ref={video}
          src={medio.src}
          poster={medio.miniatura}
          muted
          loop
          playsInline
          preload="none"
          onMouseEnter={() => void video.current?.play()}
          onMouseLeave={() => video.current?.pause()}
          className="h-full w-full object-cover"
        />
        <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 flex size-9 items-center justify-center rounded-full bg-bosque/70 text-lima backdrop-blur">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4v16l13-8z" />
          </svg>
        </span>
      </div>
    );
  }
  return <img src={medio.miniatura} alt={altMedio(medio)} loading="lazy" decoding="async" className={`h-full w-full object-cover ${className}`} />;
}
