import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { hoyIso, sumarDias } from '@/domain/fechas';
import { SENDEROS } from '@/services/memoria/datos';
import { GUIAS } from '../ejemplo';
import { CabeceraPanel, Insignia, Pais, TituloSeccion, formatoFecha, useAviso } from '../ui';

interface Salida {
  id: string;
  senderoId: string;
  hora: string;
  personas: number;
  paises: string[];
  guias: string[];
  guiasNecesarios: number;
}

/** Idioma que conviene que hable el guía según la procedencia del grupo. */
const IDIOMA_PAIS: Record<string, string> = { US: 'Inglés', GB: 'Inglés', DE: 'Inglés', FR: 'Francés', BR: 'Portugués', PT: 'Portugués' };

/** Salidas de ejemplo de un día: deterministas para que la demostración sea estable. */
function salidasDelDia(fecha: string): Salida[] {
  let h = 0;
  for (const c of fecha) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const cuantas = 3 + (h % 3);
  const paisesPosibles = [['CO'], ['CO', 'US'], ['CO', 'FR'], ['CO', 'BR'], ['CO', 'CO', 'DE'], ['CO']];
  return Array.from({ length: cuantas }, (_, i) => {
    const s = SENDEROS[(h + i * 5) % SENDEROS.length];
    const personas = 6 + ((h >>> (i + 2)) % 14);
    return {
      id: `${fecha}-${i}`,
      senderoId: s.id,
      hora: s.horaSalida,
      personas,
      paises: [...new Set(paisesPosibles[(h + i) % paisesPosibles.length])],
      guias: i === 0 ? ['g1'] : i === 1 ? ['g2'] : [],
      guiasNecesarios: personas > 12 ? 2 : 1,
    };
  }).sort((a, b) => a.hora.localeCompare(b.hora));
}

export function SalidasAdmin() {
  const { avisar } = useAviso();
  const hoy = useMemo(() => hoyIso(), []);
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(hoy, i)), [hoy]);
  const [dia, setDia] = useState(hoy);
  const [asignaciones, setAsignaciones] = useState<Record<string, string[]>>({});
  const salidas = useMemo(() => salidasDelDia(dia).map((s) => ({ ...s, guias: asignaciones[s.id] ?? s.guias })), [dia, asignaciones]);
  const sinGuia = salidas.filter((s) => s.guias.length < s.guiasNecesarios).length;

  const asignar = (s: Salida, indice: number, guiaId: string) => {
    const nuevos = [...s.guias];
    nuevos[indice] = guiaId;
    setAsignaciones((a) => ({ ...a, [s.id]: nuevos.filter(Boolean) }));
    avisar(guiaId ? `${GUIAS.find((g) => g.id === guiaId)?.nombre} asignado a ${SENDEROS.find((x) => x.id === s.senderoId)?.nombre}` : 'Guía retirado de la salida');
  };

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Operación" titulo="Salidas y guías" fotoId="camino-niebla">
        <dl className="m-0 flex gap-8">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">salidas el día</dt>
            <dd className="m-0 font-cifras text-[28px] font-black">{salidas.length}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-[13px] text-white/70">sin guía completo</dt>
            <dd className={`m-0 font-cifras text-[28px] font-black ${sinGuia > 0 ? 'text-lima' : ''}`}>{sinGuia}</dd>
          </div>
        </dl>
      </CabeceraPanel>

      <div role="group" aria-label="Día" className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {dias.map((d, i) => (
          <button
            key={d}
            type="button"
            aria-pressed={d === dia}
            onClick={() => setDia(d)}
            className={`flex flex-col items-start gap-0.5 rounded-2xl border p-3 text-left transition-colors ${d === dia ? 'border-bosque bg-bosque text-arena' : 'border-bosque/15 bg-superficie hover:border-bosque'}`}
          >
            <span className="font-mono text-[11px] tracking-[0.1em] uppercase">{i === 0 ? 'hoy' : formatoFecha(d).split(' ')[0]}</span>
            <span className="font-display text-xl font-bold">{Number(d.slice(8))}</span>
          </button>
        ))}
      </div>

      <section aria-labelledby="sa-salidas" className="flex flex-col">
        <TituloSeccion id="sa-salidas" nota="Grupos de más de 12 personas requieren dos guías">
          {`Salidas · ${formatoFecha(dia)}`}
        </TituloSeccion>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {salidas.map((s, i) => {
            const sendero = SENDEROS.find((x) => x.id === s.senderoId)!;
            const idiomasNecesarios = [...new Set(s.paises.map((p) => IDIOMA_PAIS[p]).filter(Boolean))];
            const idiomasGuias = new Set(s.guias.flatMap((g) => GUIAS.find((x) => x.id === g)?.idiomas ?? []));
            const faltaIdioma = idiomasNecesarios.filter((idioma) => !idiomasGuias.has(idioma));
            return (
              <motion.li key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="tarjeta flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <span className="font-cifras text-2xl font-black md:w-20">{s.hora}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="font-display text-lg font-bold">{sendero.nombre}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
                    {s.personas} personas · {sendero.dificultad}
                    {s.paises.map((p) => (
                      <Pais key={p} codigo={p} />
                    ))}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {s.guias.length < s.guiasNecesarios && <Insignia tono="peligro">Falta {s.guiasNecesarios - s.guias.length} guía</Insignia>}
                    {faltaIdioma.length > 0 && <Insignia tono="alerta">Necesita guía en {faltaIdioma.join(' y ').toLowerCase()}</Insignia>}
                    {s.guias.length >= s.guiasNecesarios && faltaIdioma.length === 0 && <Insignia tono="exito">Lista</Insignia>}
                  </span>
                </div>
                <div className="flex flex-col gap-2 md:w-64">
                  {Array.from({ length: s.guiasNecesarios }, (_, j) => (
                    <select
                      key={j}
                      aria-label={`Guía ${j + 1} de ${sendero.nombre}`}
                      value={s.guias[j] ?? ''}
                      onChange={(e) => asignar(s, j, e.target.value)}
                      className="h-11 w-full rounded-full border border-bosque/15 bg-arena px-4 text-sm font-semibold focus:border-bosque focus:outline-none"
                    >
                      <option value="">Asignar guía…</option>
                      {GUIAS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nombre} · {g.idiomas.map((x) => x.slice(0, 2)).join('/')}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="sa-guias" className="flex flex-col">
        <TituloSeccion id="sa-guias" nota="Idiomas, certificación y carga del mes">
          Guías
        </TituloSeccion>
        <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {GUIAS.map((g) => (
            <li key={g.id} className="tarjeta flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-bosque font-display font-extrabold text-lima">
                  {g.nombre[0]}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{g.nombre}</span>
                  <span className="text-xs text-tinta-suave">{g.certificacion}</span>
                </span>
              </div>
              <span className="flex flex-wrap gap-1.5">
                {g.idiomas.map((x) => (
                  <Insignia key={x} tono="info">
                    {x}
                  </Insignia>
                ))}
              </span>
              <span className="flex justify-between border-t linea pt-3 text-sm">
                <span>{g.salidasMes} salidas este mes</span>
                <span className="font-bold">★ {g.calificacion.toFixed(1)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
