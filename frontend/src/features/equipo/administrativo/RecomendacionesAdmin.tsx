import { useState } from 'react';
import { motion } from 'motion/react';
import { fotoDeSendero } from '@/contenido/fotos';
import { Boton } from '@/ui/Boton';
import { PESOS_RECOMENDACION, nombreSendero } from '../ejemplo';
import { CabeceraPanel, Insignia, TituloSeccion, useAviso } from '../ui';

type Peso = keyof typeof PESOS_RECOMENDACION;

const CRITERIOS: { clave: Peso; titulo: string; detalle: string }[] = [
  { clave: 'dificultad', titulo: 'Dificultad', detalle: 'Que el sendero se ajuste a la condición física declarada.' },
  { clave: 'temporada', titulo: 'Temporada', detalle: 'Priorizar senderos con menos ocupación y buen clima esa semana.' },
  { clave: 'perfil', titulo: 'Perfil del visitante', detalle: 'Familias, aventureros, fotógrafos, observadores de aves.' },
  { clave: 'historial', titulo: 'Historial', detalle: 'No repetir senderos ya visitados y sugerir el siguiente nivel.' },
];

const EJEMPLOS = [
  { perfil: 'Familia con niños', senderos: ['la-paila', 'laguna-seca', 'la-arboleda'] },
  { perfil: 'Aventurero con experiencia', senderos: ['cuchilla-el-zaque', 'chorreras', 'piedras-gordas'] },
  { perfil: 'Fotógrafo de naturaleza', senderos: ['bosque-de-niebla', 'lagunas-de-siecha', 'suasie'] },
];

/** Reglas del motor de recomendación (RF-40). Solo la interfaz: el cálculo vive en el servidor. */
export function RecomendacionesAdmin() {
  const { avisar } = useAviso();
  const [pesos, setPesos] = useState(PESOS_RECOMENDACION);
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Motor de recomendación" titulo="Recomendaciones" fotoId="flor-frailejon">
        <Boton onClick={() => avisar('Reglas guardadas: se aplican a las próximas recomendaciones')} disabled={total !== 100}>
          Guardar reglas
        </Boton>
      </CabeceraPanel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[1.2fr_1fr]">
        <section aria-labelledby="rec-pesos" className="flex flex-col gap-4">
          <TituloSeccion id="rec-pesos" nota="Peso de cada criterio al ordenar las sugerencias" accion={<Insignia tono={total === 100 ? 'exito' : 'alerta'}>{`Suma ${total} %${total === 100 ? '' : ' · debe ser 100 %'}`}</Insignia>}>
            Criterios
          </TituloSeccion>
          {CRITERIOS.map((c) => (
            <label key={c.clave} className="tarjeta flex flex-col gap-3 p-5">
              <span className="flex items-baseline justify-between gap-4">
                <span className="flex flex-col">
                  <span className="font-display text-lg font-bold">{c.titulo}</span>
                  <span className="text-sm text-tinta-suave">{c.detalle}</span>
                </span>
                <span className="font-cifras text-2xl font-black">{pesos[c.clave]} %</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={pesos[c.clave]}
                onChange={(e) => setPesos((p) => ({ ...p, [c.clave]: Number(e.target.value) }))}
                className="h-8 w-full cursor-pointer accent-[var(--color-bosque)]"
              />
            </label>
          ))}
        </section>

        <section aria-labelledby="rec-vista" className="flex flex-col gap-4">
          <TituloSeccion id="rec-vista" nota="Ejemplo de lo que vería cada perfil">
            Vista previa
          </TituloSeccion>
          {EJEMPLOS.map((e, i) => (
            <motion.div key={e.perfil} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="tarjeta flex flex-col gap-3 p-5">
              <span className="etiqueta text-tinta-suave">{e.perfil}</span>
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {e.senderos.map((id, j) => (
                  <li key={id} className="flex items-center gap-3">
                    <span className="font-cifras text-sm font-black text-ecosistema">{j + 1}</span>
                    <img src={fotoDeSendero(id).srcPequena} alt="" className="size-10 rounded-xl object-cover" />
                    <span className="font-semibold">{nombreSendero(id)}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  );
}
