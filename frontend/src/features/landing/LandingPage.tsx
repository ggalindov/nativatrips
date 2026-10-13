import { useServicios } from '@/services/ServiciosContext';
import { useConsulta } from '@/services/useConsulta';
import { EnlaceBoton } from '@/ui/Boton';
import { Cargando, ErrorCarga } from '@/ui/Estados';
import { Descenso } from './Descenso';
import { ListaSenderos } from './ListaSenderos';

const CIFRAS = [
  { valor: '13', texto: 'senderos oficiales' },
  { valor: '3.9k', texto: 'm s.n.m. de altura máxima' },
  { valor: '0', texto: 'cuentas que crear para reservar' },
  { valor: 'PNN', texto: 'Parque Nacional Natural Chingaza' },
];

const PASOS = [
  { numero: '01', titulo: 'Elige sendero y fecha', texto: 'Ves los cupos que quedan para cada día antes de decidir.' },
  { numero: '02', titulo: 'Paga con PayU', texto: 'Tarjeta, PSE o efectivo. El cupo queda apartado mientras pagas.' },
  { numero: '03', titulo: 'Recibe tu enlace', texto: 'Te llega un enlace al correo para ver, pagar o cancelar tu reserva cuando quieras.' },
];

const CONSEJOS = [
  { tema: 'Altura', texto: 'Los senderos están entre los 3.000 y los 4.000 m. Camina a ritmo constante e hidrátate.' },
  { tema: 'Ropa', texto: 'Capas, impermeable y botas con agarre. El clima cambia en minutos.' },
  { tema: 'Normas', texto: 'No salir del sendero, no tocar los frailejones, llevarse toda la basura.' },
];

function Encabezado({ antetitulo, titulo, oscuro = false }: { antetitulo: string; titulo: string; oscuro?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <span className={`etiqueta ${oscuro ? 'text-lima' : 'text-tinta-suave'}`}>{antetitulo}</span>
      <h2 className={`m-0 font-display text-4xl leading-none font-extrabold tracking-tight md:text-[52px] ${oscuro ? 'text-white' : ''}`}>
        {titulo}
      </h2>
    </div>
  );
}

export function LandingPage() {
  const { senderos } = useServicios();
  const { estado, recargar } = useConsulta(() => senderos.listar(), [senderos]);

  return (
    <>
      <Descenso />

      <section aria-label="NativaTrips en cifras" className="bg-bosque">
        <dl className="mx-auto m-0 grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-8 md:grid-cols-4 lg:px-12">
          {CIFRAS.map((c) => (
            <div key={c.texto} className="flex flex-col-reverse gap-2">
              <dt className="text-sm text-white/70">{c.texto}</dt>
              <dd className="m-0 font-cifras text-2xl font-black text-lima-suave">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="senderos" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-24 pb-20 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 md:grid-cols-2">
          <Encabezado antetitulo="Senderos" titulo="Trece rutas, un mismo cuidado." />
          <p className="m-0 text-[17px] leading-relaxed text-tinta">
            Cada sendero tiene un aforo diario fijado con el parque. Cuando se llena, se cierra la fecha: así el páramo se
            recupera entre grupos.
          </p>
        </div>
        {estado.tipo === 'cargando' && <Cargando texto="Cargando senderos…" />}
        {estado.tipo === 'error' && <ErrorCarga mensaje={estado.mensaje} reintentar={recargar} />}
        {estado.tipo === 'listo' && <ListaSenderos senderos={estado.datos} />}
      </section>

      <section id="reservar" className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 rounded-[40px] bg-bosque px-6 py-16 text-white md:px-14 md:py-20">
          <Encabezado antetitulo="Cómo reservar" titulo="Sin cuentas. Sin contraseñas." oscuro />
          <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
            {PASOS.map((p) => (
              <li key={p.numero} className="flex flex-col gap-3 rounded-3xl border border-bosque-3 bg-bosque-2 p-6">
                <span className="font-cifras text-lg font-black text-lima-suave">{p.numero}</span>
                <h3 className="m-0 font-display text-xl font-bold">{p.titulo}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-white/70">{p.texto}</p>
              </li>
            ))}
          </ol>
          <div>
            <EnlaceBoton to="/reservar" conFlecha>
              Reservar un sendero
            </EnlaceBoton>
          </div>
        </div>
      </section>

      <section id="antes" className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-24 sm:px-8 lg:px-12">
        <div className="grid items-start gap-10 md:grid-cols-2">
          <Encabezado antetitulo="Antes de subir" titulo="Arriba hace frío, y el aire es otro." />
          <dl className="m-0 flex flex-col gap-3">
            {CONSEJOS.map((c) => (
              <div key={c.tema} className="tarjeta grid grid-cols-[96px_minmax(0,1fr)] gap-4 px-6 py-5">
                <dt className="etiqueta pt-1 text-tinta-suave">{c.tema}</dt>
                <dd className="m-0 text-base leading-relaxed">{c.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="m-0 flex h-[420px] items-end rounded-[40px] bg-salvia-clara p-6">
          <figcaption className="text-xs font-semibold text-tinta">[FOTO REAL · Laguna de Siecha · licencia libre con atribución]</figcaption>
        </figure>
      </section>
    </>
  );
}
