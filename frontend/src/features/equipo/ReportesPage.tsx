import { useState } from 'react';
import { motion } from 'motion/react';
import { Boton } from '@/ui/Boton';
import { REPORTE_AMBIENTAL, nombreSendero } from './ejemplo';
import { CabeceraPanel, Indicador, Insignia, TituloSeccion, useAviso } from './ui';

const MESES = [
  { valor: '2026-10', texto: 'Octubre 2026' },
  { valor: '2026-09', texto: 'Septiembre 2026' },
  { valor: '2026-08', texto: 'Agosto 2026' },
];

const entero = new Intl.NumberFormat('es-CO');

/** Reporte de cumplimiento ambiental para la autoridad ambiental (RF-27, RF-39). */
export function ReportesPage() {
  const { avisar } = useAviso();
  const [mes, setMes] = useState('2026-10');
  const filas = REPORTE_AMBIENTAL.map((r) => ({ ...r, pct: Math.round((r.visitantes / r.limite) * 100) }));
  const total = filas.reduce((a, r) => ({ visitantes: a.visitantes + r.visitantes, limite: a.limite + r.limite, tours: a.tours + r.toursCerrados, dias: a.dias + r.diasSobreUmbral, incidentes: a.incidentes + r.incidentes }), { visitantes: 0, limite: 0, tours: 0, dias: 0, incidentes: 0 });
  const exportar = (formato: string) => avisar(`Reporte en ${formato} listo para descargar cuando se conecte el servidor`);

  return (
    <div className="flex flex-col gap-10">
      <CabeceraPanel etiqueta="Cumplimiento de capacidad de carga" titulo="Reporte ambiental" fotoId="rio-la-playa">
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="mes-reporte">
            Mes del reporte
          </label>
          <select id="mes-reporte" value={mes} onChange={(e) => setMes(e.target.value)} className="h-12 rounded-full border border-white/20 bg-bosque-2 px-4 text-sm font-semibold text-white focus:border-lima focus:outline-none">
            {MESES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.texto}
              </option>
            ))}
          </select>
          <Boton onClick={() => exportar('PDF')}>Exportar PDF</Boton>
          <Boton variante="secundarioClaro" onClick={() => exportar('CSV')}>
            Exportar CSV
          </Boton>
        </div>
      </CabeceraPanel>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador titulo="Visitantes del mes" valor={entero.format(total.visitantes)} nota={`de ${entero.format(total.limite)} autorizados`} />
        <Indicador titulo="Uso de la capacidad" valor={`${Math.round((total.visitantes / total.limite) * 100)} %`} nota="promedio del parque" />
        <Indicador titulo="Tours cerrados" valor={entero.format(total.tours)} nota="con asistencia registrada" />
        <Indicador titulo="Incidentes" valor={String(total.incidentes)} nota={`${total.dias} días sobre el umbral`} />
      </div>

      <section aria-labelledby="rep-tabla" className="flex flex-col">
        <TituloSeccion id="rep-tabla" nota="Ningún sendero superó su límite: las reservas que lo excedían se rechazaron automáticamente">
          Detalle por sendero
        </TituloSeccion>
        <div className="tarjeta relative overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">
                <th scope="col" className="px-5 py-3 font-medium">Sendero</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Visitantes</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Límite</th>
                <th scope="col" className="w-[24%] px-3 py-3 font-medium">Uso</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">Días ≥ 80 %</th>
                <th scope="col" className="px-5 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((r, i) => (
                <tr key={r.senderoId} className="border-t linea">
                  <td className="px-5 py-3 font-semibold">{nombreSendero(r.senderoId)}</td>
                  <td className="px-3 py-3 text-right font-mono">{entero.format(r.visitantes)}</td>
                  <td className="px-3 py-3 text-right font-mono">{entero.format(r.limite)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 flex-1 rounded-full bg-bosque/8">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 0.7, delay: i * 0.03 }} className={`h-2 rounded-full ${r.pct >= 80 ? 'bg-advertencia' : 'bg-[#3a8a5c]'}`} />
                      </div>
                      <span className="w-11 text-right font-mono text-sm">{r.pct} %</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{r.diasSobreUmbral}</td>
                  <td className="px-5 py-3">
                    {r.incidentes > 0 ? <Insignia tono="alerta">{r.incidentes} incidente</Insignia> : <Insignia tono="exito">Cumple</Insignia>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
