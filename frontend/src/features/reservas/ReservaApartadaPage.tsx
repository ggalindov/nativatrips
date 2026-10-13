import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatearFecha } from '@/domain/fechas';

interface EstadoNavegacion {
  codigo: string;
  correo: string;
  senderoNombre?: string;
  fecha?: string;
  enlaceDesarrollo?: string;
}

export function ReservaApartadaPage() {
  const estado = useLocation().state as EstadoNavegacion | null;
  if (!estado?.codigo) return <Navigate to="/reservar" replace />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 pt-20 pb-28">
      <span className="font-mono text-sm text-tinta-suave">Reserva {estado.codigo}</span>
      <h1 className="m-0 font-display text-5xl leading-none font-extrabold tracking-tight">Tu cupo está apartado.</h1>
      <p className="m-0 text-lg leading-relaxed text-tinta">
        Enviamos un enlace a <strong className="font-semibold text-bosque">{estado.correo}</strong> para pagar con PayU y
        gestionar la reserva{estado.senderoNombre ? ` de ${estado.senderoNombre}` : ''}
        {estado.fecha ? ` del ${formatearFecha(estado.fecha)}` : ''}. Revisa también la carpeta de spam.
      </p>
      <p className="m-0 text-base text-tinta">
        ¿No te llegó? Pídelo de nuevo en <Link to="/mi-reserva">Mi reserva</Link> con tu código y tu correo.
      </p>
      {estado.enlaceDesarrollo && (
        <div className="flex flex-col gap-2 border-t linea pt-6">
          <span className="etiqueta text-tinta-suave">Solo en desarrollo</span>
          <Link to={estado.enlaceDesarrollo}>Abrir el enlace que llegaría por correo →</Link>
        </div>
      )}
    </div>
  );
}
