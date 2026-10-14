import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { ETIQUETA_ROL } from '@/domain/equipo';
import type { RolEquipo } from '@/domain/equipo';
import { Boton } from '@/ui/Boton';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';
import { CUENTAS } from '../ejemplo';
import type { CuentaEquipo } from '../ejemplo';
import { Busqueda, CabeceraPanel, Cajon, Insignia, Pestanas, useAviso } from '../ui';

type Filtro = 'todos' | RolEquipo;
const ROLES: RolEquipo[] = ['PERSONAL_ADMINISTRATIVO', 'GUIA_TURISTICO', 'GERENCIA'];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NuevaCuenta({ abierta, onCerrar, onCrear }: { abierta: boolean; onCerrar: () => void; onCrear: (c: CuentaEquipo) => void }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState<RolEquipo>('GUIA_TURISTICO');
  const [intentado, setIntentado] = useState(false);
  const errorNombre = intentado && nombre.trim().length < 3 ? 'Escribe el nombre completo.' : undefined;
  const errorCorreo = intentado && !CORREO.test(correo.trim()) ? 'Escribe un correo válido.' : undefined;
  const crear = (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (nombre.trim().length < 3 || !CORREO.test(correo.trim())) return;
    onCrear({ id: `u${Date.now()}`, nombre: nombre.trim(), correo: correo.trim().toLowerCase(), rol, activa: true, ultimoAcceso: 'nunca' });
    setNombre('');
    setCorreo('');
    setIntentado(false);
  };
  return (
    <Cajon
      abierto={abierta}
      onCerrar={onCerrar}
      titulo="Nueva cuenta"
      subtitulo="La persona recibe un correo para crear su contraseña"
      pie={
        <>
          <Boton variante="secundario" className="h-11 px-5 text-sm" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-cuenta" className="h-11 px-5 text-sm">
            Crear y enviar invitación
          </Boton>
        </>
      }
    >
      <form id="form-cuenta" onSubmit={crear} noValidate className="flex flex-col gap-6">
        <Campo etiqueta="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errorNombre} />
        <Campo etiqueta="Correo de trabajo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} />
        <Selector etiqueta="Rol" value={rol} onChange={(e) => setRol(e.target.value as RolEquipo)} opciones={ROLES.map((r) => ({ valor: r, texto: ETIQUETA_ROL[r] }))} />
        <ul className="m-0 flex list-none flex-col gap-2 rounded-2xl bg-superficie p-4 text-sm text-tinta">
          <li>
            <strong>Personal administrativo:</strong> reservas, salidas, capacidad, catálogo y conversaciones.
          </li>
          <li>
            <strong>Guía:</strong> su agenda, la lista del grupo y la asistencia.
          </li>
          <li>
            <strong>Gerencia:</strong> indicadores, reportes y las cuentas del equipo.
          </li>
        </ul>
      </form>
    </Cajon>
  );
}

/** Cuentas del personal: solo gerencia las crea, cambia de rol o desactiva. */
export function EquipoGerencia() {
  const { avisar } = useAviso();
  const [cuentas, setCuentas] = useState(CUENTAS);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [texto, setTexto] = useState('');
  const [creando, setCreando] = useState(false);
  const visibles = cuentas.filter((c) => (filtro === 'todos' || c.rol === filtro) && `${c.nombre} ${c.correo}`.toLowerCase().includes(texto.trim().toLowerCase()));
  const actualizar = (id: string, cambios: Partial<CuentaEquipo>) => setCuentas((cs) => cs.map((c) => (c.id === id ? { ...c, ...cambios } : c)));

  return (
    <div className="flex flex-col gap-8">
      <CabeceraPanel etiqueta="Gerencia · accesos" titulo="Equipo" fotoId="monterredondo">
        <Boton onClick={() => setCreando(true)} conFlecha>
          Nueva cuenta
        </Boton>
      </CabeceraPanel>

      <div className="flex flex-col gap-3">
        <Pestanas
          etiqueta="Rol"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[{ valor: 'todos' as Filtro, texto: 'Todos', cuenta: cuentas.length }, ...ROLES.map((r) => ({ valor: r as Filtro, texto: ETIQUETA_ROL[r], cuenta: cuentas.filter((c) => c.rol === r).length }))]}
        />
        <Busqueda valor={texto} onCambio={setTexto} etiqueta="Buscar persona" placeholder="Nombre o correo" />
      </div>

      <ul aria-label="Cuentas del equipo" className="m-0 flex list-none flex-col gap-3 p-0">
        {visibles.map((c, i) => (
          <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className={`tarjeta grid grid-cols-[minmax(0,1fr)] items-center gap-4 p-5 md:grid-cols-[minmax(0,1.4fr)_200px_auto] ${c.activa ? '' : 'opacity-60'}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-bosque font-display font-extrabold text-lima">
                {c.nombre[0]}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{c.nombre}</span>
                  {!c.activa && <Insignia tono="neutro">Desactivada</Insignia>}
                </span>
                <span className="truncate text-sm text-tinta-suave">
                  {c.correo} · último acceso {c.ultimoAcceso}
                </span>
              </span>
            </div>
            <select
              aria-label={`Rol de ${c.nombre}`}
              value={c.rol}
              onChange={(e) => {
                actualizar(c.id, { rol: e.target.value as RolEquipo });
                avisar(`${c.nombre} ahora es ${ETIQUETA_ROL[e.target.value as RolEquipo].toLowerCase()}`);
              }}
              className="h-11 rounded-full border border-bosque/15 bg-arena px-4 text-sm font-semibold focus:border-bosque focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Boton variante="secundario" className="h-10 px-4 text-sm" onClick={() => avisar(`Enlace para restablecer la contraseña enviado a ${c.correo}`)}>
                Restablecer clave
              </Boton>
              <Boton
                variante={c.activa ? 'secundario' : 'oscuro'}
                className="h-10 px-4 text-sm"
                onClick={() => {
                  actualizar(c.id, { activa: !c.activa });
                  avisar(c.activa ? `Cuenta de ${c.nombre} desactivada` : `Cuenta de ${c.nombre} activada`);
                }}
              >
                {c.activa ? 'Desactivar' : 'Activar'}
              </Boton>
            </div>
          </motion.li>
        ))}
      </ul>

      <NuevaCuenta
        abierta={creando}
        onCerrar={() => setCreando(false)}
        onCrear={(c) => {
          setCuentas((cs) => [c, ...cs]);
          setCreando(false);
          avisar(`Invitación enviada a ${c.correo}`);
        }}
      />
    </div>
  );
}
