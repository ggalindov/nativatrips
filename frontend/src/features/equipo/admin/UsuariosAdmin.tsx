import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { ETIQUETA_ROL, ROLES_EQUIPO } from '@/domain/equipo';
import type { RolEquipo } from '@/domain/equipo';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { useSesion } from '../SesionContext';
import { CUENTAS } from '../ejemplo';
import type { CuentaEquipo } from '../ejemplo';
import { BorrarConConfirmacion, Busqueda, CabeceraPanel, Cajon, Insignia, Interruptor, Pestanas, useAviso } from '../ui';

type Filtro = 'todos' | RolEquipo | 'inactivas';
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VACIA: CuentaEquipo = { id: '', nombre: '', correo: '', telefono: '', rol: 'GUIA_TURISTICO', activa: true, ultimoAcceso: 'nunca' };

const PERMISOS: Record<RolEquipo, string> = {
  ADMINISTRADOR: 'Todo el sistema: operación, recorridos, biblioteca, usuarios, indicadores y reportes.',
  GUIA_TURISTICO: 'Su agenda, la lista de cada grupo, la asistencia y las novedades del tour.',
};

/** Ficha para crear o editar una cuenta; el borrado pide confirmación. */
function FichaCuenta({
  cuenta,
  propia,
  onCerrar,
  onGuardar,
  onEliminar,
}: {
  cuenta: CuentaEquipo | null;
  propia: boolean;
  onCerrar: () => void;
  onGuardar: (c: CuentaEquipo) => void;
  onEliminar: (c: CuentaEquipo) => void;
}) {
  const { avisar } = useAviso();
  const [borrador, setBorrador] = useState<CuentaEquipo | null>(null);
  const [intentado, setIntentado] = useState(false);
  const actual = borrador && cuenta && borrador.id === cuenta.id ? borrador : cuenta;
  const nueva = cuenta?.id === '';
  const cambiar = <K extends keyof CuentaEquipo>(campo: K, valor: CuentaEquipo[K]) => actual && setBorrador({ ...actual, [campo]: valor });
  const errorNombre = intentado && actual && actual.nombre.trim().length < 3 ? 'Escribe el nombre completo.' : undefined;
  const errorCorreo = intentado && actual && !CORREO.test(actual.correo.trim()) ? 'Escribe un correo válido.' : undefined;
  const cerrar = () => {
    setBorrador(null);
    setIntentado(false);
    onCerrar();
  };
  const guardar = (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (!actual || actual.nombre.trim().length < 3 || !CORREO.test(actual.correo.trim())) return;
    onGuardar({ ...actual, id: actual.id || `u${Date.now()}`, nombre: actual.nombre.trim(), correo: actual.correo.trim().toLowerCase() });
    setBorrador(null);
    setIntentado(false);
  };

  return (
    <Cajon
      abierto={cuenta !== null}
      onCerrar={cerrar}
      titulo={nueva ? 'Nueva cuenta' : (cuenta?.nombre ?? '')}
      subtitulo={nueva ? 'La persona recibe un correo para crear su contraseña' : `Último acceso: ${cuenta?.ultimoAcceso ?? ''}`}
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-cuenta" className="h-11 px-5 text-sm">
            {nueva ? 'Crear y enviar invitación' : 'Guardar cambios'}
          </Boton>
        </>
      }
    >
      {actual && (
        <form id="form-cuenta" onSubmit={guardar} noValidate className="flex flex-col gap-6">
          <Campo etiqueta="Nombre completo" value={actual.nombre} onChange={(e) => cambiar('nombre', e.target.value)} error={errorNombre} />
          <Campo etiqueta="Correo de trabajo" type="email" value={actual.correo} onChange={(e) => cambiar('correo', e.target.value)} error={errorCorreo} />
          <Campo etiqueta="Teléfono" type="tel" value={actual.telefono ?? ''} onChange={(e) => cambiar('telefono', e.target.value)} ayuda="Opcional · para avisos el día de la salida" />
          <Selector
            etiqueta="Rol"
            value={actual.rol}
            disabled={propia}
            ayuda={propia ? 'No puedes cambiar tu propio rol.' : PERMISOS[actual.rol]}
            onChange={(e) => cambiar('rol', e.target.value as RolEquipo)}
            opciones={ROLES_EQUIPO.map((r) => ({ valor: r, texto: ETIQUETA_ROL[r] }))}
          />
          {!nueva && (
            <>
              <Interruptor
                titulo="Cuenta activa"
                nota={propia ? 'No puedes desactivar tu propia cuenta.' : 'Si la desactivas, la persona no puede ingresar pero su historial se conserva.'}
                activo={actual.activa}
                onCambio={(v) => !propia && cambiar('activa', v)}
              />
              <div className="flex flex-col gap-3 border-t linea pt-5">
                <Boton variante="secundario" className="h-11 self-start px-5 text-sm" onClick={() => avisar(`Enlace para restablecer la contraseña enviado a ${actual.correo}`)}>
                  Enviar enlace para restablecer la clave
                </Boton>
                {!propia && (
                  <BorrarConConfirmacion
                    texto="Eliminar cuenta"
                    confirmacion={`¿Eliminar la cuenta de ${actual.nombre}? Sus salidas pasadas quedan en los reportes, pero no podrá volver a ingresar.`}
                    onBorrar={() => {
                      setBorrador(null);
                      onEliminar(actual);
                    }}
                  />
                )}
              </div>
            </>
          )}
        </form>
      )}
    </Cajon>
  );
}

/** Cuentas del personal: el administrador las crea, edita, desactiva o elimina. */
export function UsuariosAdmin() {
  const { avisar } = useAviso();
  const { sesion } = useSesion();
  const [cuentas, setCuentas] = useState(CUENTAS);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<CuentaEquipo | null>(null);
  const visibles = cuentas.filter(
    (c) =>
      (filtro === 'todos' || (filtro === 'inactivas' ? !c.activa : c.rol === filtro)) &&
      `${c.nombre} ${c.correo}`.toLowerCase().includes(texto.trim().toLowerCase()),
  );
  const esPropia = (c: CuentaEquipo | null) => !!c && c.correo === sesion?.correo;

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Accesos al sistema" titulo="Usuarios" fotoId="monterredondo">
        <Boton onClick={() => setEditando({ ...VACIA })} conFlecha>
          Nueva cuenta
        </Boton>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <Pestanas
          etiqueta="Filtrar por rol"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[
            { valor: 'todos' as Filtro, texto: 'Todos', cuenta: cuentas.length },
            ...ROLES_EQUIPO.map((r) => ({ valor: r as Filtro, texto: r === 'ADMINISTRADOR' ? 'Administradores' : 'Guías', cuenta: cuentas.filter((c) => c.rol === r).length })),
            { valor: 'inactivas' as Filtro, texto: 'Desactivadas', cuenta: cuentas.filter((c) => !c.activa).length },
          ]}
        />
        <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar persona" placeholder="Nombre o correo" />
      </div>

      <ul aria-label="Cuentas del equipo" className="m-0 flex list-none flex-col gap-3 p-0">
        {visibles.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            className={`tarjeta grid grid-cols-[minmax(0,1fr)] items-center gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] ${c.activa ? '' : 'opacity-60'}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-bosque font-display font-extrabold text-lima">
                {c.nombre[0]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{c.nombre}</span>
                  <Insignia tono={c.rol === 'ADMINISTRADOR' ? 'lima' : 'info'}>{ETIQUETA_ROL[c.rol]}</Insignia>
                  {!c.activa && <Insignia tono="neutro">Desactivada</Insignia>}
                  {esPropia(c) && <Insignia tono="neutro">Tú</Insignia>}
                </span>
                <span className="truncate text-sm text-tinta-suave">
                  {c.correo} · último acceso {c.ultimoAcceso}
                </span>
              </span>
            </div>
            <Boton variante="oscuro" className="h-10 px-5 text-sm" onClick={() => setEditando(c)} aria-label={`Editar a ${c.nombre}`}>
              Editar
            </Boton>
          </motion.li>
        ))}
        {visibles.length === 0 && <li className="tarjeta p-8 text-center text-tinta-suave">No hay cuentas con ese filtro.</li>}
      </ul>

      <FichaCuenta
        cuenta={editando}
        propia={esPropia(editando)}
        onCerrar={() => setEditando(null)}
        onGuardar={(c) => {
          const existe = cuentas.some((x) => x.id === c.id);
          setCuentas((cs) => (existe ? cs.map((x) => (x.id === c.id ? c : x)) : [c, ...cs]));
          setEditando(null);
          avisar(existe ? `Cuenta de ${c.nombre} actualizada` : `Invitación enviada a ${c.correo}`);
        }}
        onEliminar={(c) => {
          setCuentas((cs) => cs.filter((x) => x.id !== c.id));
          setEditando(null);
          avisar(`Cuenta de ${c.nombre} eliminada`);
        }}
      />
    </div>
  );
}
