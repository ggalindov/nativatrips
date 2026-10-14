import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { COLOMBIA, bandera, esExtranjero, indicativoDe, paisesOrdenados } from '@/domain/paises';
import type { ErrorValidacion, Persona, Titular } from '@/domain/reserva';
import { documentoAlfanumerico, documentosPara } from '@/domain/reserva';
import { useIdioma } from '@/i18n/IdiomaContext';
import { Campo } from '@/ui/Campo';
import { Selector } from '@/ui/Selector';

/** Bandera de Colombia dibujada: Windows no muestra banderas en emoji. */
function BanderaColombia() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" className="flex-none overflow-hidden rounded-[3px] shadow-sm">
      <rect width="20" height="7" fill="#FCD116" />
      <rect y="7" width="20" height="3.5" fill="#003893" />
      <rect y="10.5" width="20" height="3.5" fill="#CE1126" />
    </svg>
  );
}

function IconoGlobo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </svg>
  );
}

/** Errores de validación que corresponden a cada campo. */
function errorDe(errores: readonly ErrorValidacion[], ...codigos: ErrorValidacion[]): ErrorValidacion | undefined {
  return errores.find((e) => codigos.includes(e));
}

interface PropsPersona {
  persona: Persona;
  onCambio: (p: Persona) => void;
  errores?: readonly ErrorValidacion[];
  /** Prefijo único para los nombres de grupo (titular, acompañante…). */
  nombreGrupo: string;
}

/**
 * Nombre, procedencia, nacionalidad y documento de un visitante. Al marcar
 * "extranjera" se elige el país y se ofrecen solo documentos válidos para
 * extranjeros (pasaporte, cédula de extranjería, PPT o DNI).
 */
export function CamposPersona({ persona, onCambio, errores = [], nombreGrupo }: PropsPersona) {
  const { t, locale } = useIdioma();
  const paises = useMemo(() => paisesOrdenados(locale).filter((p) => p.codigo !== COLOMBIA), [locale]);
  const extranjero = esExtranjero(persona.nacionalidad);
  const documentos = documentosPara(persona.nacionalidad);
  const mensaje = (e?: ErrorValidacion) => (e ? t.validacion[e] : undefined);

  const cambiarOrigen = (aExtranjero: boolean) => {
    if (aExtranjero === extranjero) return;
    const nacionalidad = aExtranjero ? (paises[0]?.codigo ?? 'US') : COLOMBIA;
    onCambio({ ...persona, nacionalidad, tipoDocumento: documentosPara(nacionalidad)[0], documento: '' });
  };

  return (
    <div className="flex flex-col gap-6">
      <Campo etiqueta={t.persona.nombre} autoComplete="name" value={persona.nombre} onChange={(e) => onCambio({ ...persona, nombre: e.target.value })} error={mensaje(errorDe(errores, 'nombre'))} />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="etiqueta mb-2 text-tinta-suave">{t.persona.origen}</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-arena p-1">
          {[false, true].map((valor) => {
            const activo = extranjero === valor;
            return (
              <label key={String(valor)} className="relative flex h-11 cursor-pointer items-center justify-center rounded-full text-sm font-semibold">
                <input type="radio" name={`${nombreGrupo}-origen`} checked={activo} onChange={() => cambiarOrigen(valor)} className="peer sr-only" />
                {activo && <motion.span layoutId={`${nombreGrupo}-origen-activo`} className="absolute inset-0 rounded-full bg-bosque" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className={`relative flex items-center gap-2 ${activo ? 'text-lima' : 'text-bosque'} peer-focus-visible:underline`}>
                  {valor ? <IconoGlobo /> : <BanderaColombia />}
                  {valor ? t.persona.extranjero : t.persona.colombiano}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {extranjero && (
            <motion.div key="pais" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="sm:col-span-2">
              <Selector
                etiqueta={t.persona.nacionalidad}
                value={persona.nacionalidad}
                onChange={(e) => onCambio({ ...persona, nacionalidad: e.target.value })}
                opciones={paises.map((p) => ({ valor: p.codigo, texto: `${bandera(p.codigo)} ${p.nombre}` }))}
                error={mensaje(errorDe(errores, 'nacionalidad'))}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Selector
          etiqueta={t.persona.tipoDocumento}
          value={persona.tipoDocumento}
          onChange={(e) => onCambio({ ...persona, tipoDocumento: e.target.value as Persona['tipoDocumento'], documento: '' })}
          opciones={documentos.map((d) => ({ valor: d, texto: t.persona.documentos[d] }))}
          error={mensaje(errorDe(errores, 'tipoDocumento'))}
        />
        <Campo
          etiqueta={t.persona.numeroDocumento}
          inputMode={documentoAlfanumerico(persona.tipoDocumento) ? 'text' : 'numeric'}
          autoCapitalize="characters"
          spellCheck={false}
          value={persona.documento}
          onChange={(e) => onCambio({ ...persona, documento: e.target.value })}
          ayuda={t.persona.ayudaDocumento[persona.tipoDocumento]}
          error={mensaje(errorDe(errores, 'documentoNumerico', 'documentoAlfanumerico'))}
        />
      </div>
    </div>
  );
}

interface PropsContacto {
  titular: Titular;
  onCambio: (t: Titular) => void;
  errores?: readonly ErrorValidacion[];
}

/** Correo y celular con indicativo internacional; el indicativo sigue a la nacionalidad mientras no se cambie a mano. */
export function CamposContacto({ titular, onCambio, errores = [] }: PropsContacto) {
  const { t, locale } = useIdioma();
  const paises = useMemo(() => paisesOrdenados(locale), [locale]);
  const indicativos = useMemo(() => {
    const vistos = new Set<string>();
    return paises
      .filter((p) => !vistos.has(p.indicativo) && vistos.add(p.indicativo))
      .map((p) => ({ valor: p.indicativo, texto: `${bandera(p.codigo)} +${p.indicativo}` }));
  }, [paises]);
  const mensaje = (e?: ErrorValidacion) => (e ? t.validacion[e] : undefined);
  const errorCelular = errorDe(errores, 'celularColombia', 'celularInternacional');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2">
      <Campo etiqueta={t.persona.correo} type="email" autoComplete="email" value={titular.correo} onChange={(e) => onCambio({ ...titular, correo: e.target.value })} error={mensaje(errorDe(errores, 'correo'))} />
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3">
        <Selector etiqueta={t.persona.indicativo} value={titular.indicativo} onChange={(e) => onCambio({ ...titular, indicativo: e.target.value })} opciones={indicativos} autoComplete="tel-country-code" />
        <Campo etiqueta={t.persona.celular} type="tel" autoComplete="tel-national" value={titular.celular} onChange={(e) => onCambio({ ...titular, celular: e.target.value })} error={mensaje(errorCelular)} />
      </div>
    </div>
  );
}

/** Al cambiar la nacionalidad del titular, el indicativo se ajusta al país (si la persona no lo eligió a mano). */
export function ajustarIndicativo(anterior: Titular, nuevo: Titular): Titular {
  if (anterior.nacionalidad === nuevo.nacionalidad) return nuevo;
  return anterior.indicativo === indicativoDe(anterior.nacionalidad) ? { ...nuevo, indicativo: indicativoDe(nuevo.nacionalidad) } : nuevo;
}

/** Aviso para visitantes extranjeros: documento en la entrada y tarifa diferenciada del parque. */
export function AvisoExtranjeros() {
  const { t } = useIdioma();
  return (
    <motion.div
      role="note"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 rounded-2xl border border-ecosistema/30 bg-ecosistema/10 p-4 text-[15px] leading-relaxed"
    >
      <span aria-hidden="true" className="text-2xl">🧭</span>
      <div className="flex flex-col gap-1">
        <span className="font-display font-bold">{t.persona.avisoExtranjero.titulo}</span>
        <span className="text-tinta">{t.persona.avisoExtranjero.texto}</span>
      </div>
    </motion.div>
  );
}
