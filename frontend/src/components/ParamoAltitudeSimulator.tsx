import React, { useState } from 'react';
import { 
  Mountain, 
  Thermometer, 
  Gauge, 
  Wind, 
  Droplet, 
  Activity, 
  Compass, 
  ShieldAlert, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface AltitudeWaypoint {
  altitude: number;
  name: string;
  location: string;
  zone: 'Sabana' | 'Bosque Altoandino' | 'Subpáramo' | 'Superpáramo';
  temp: number;
  windSpeed: number;
  pressureHpa: number;
  o2Percent: number;
  thermalSensation: number;
  clothing: string;
  advice: string;
}

const WAYPOINTS: AltitudeWaypoint[] = [
  {
    altitude: 2600,
    name: 'Sabana / La Calera',
    location: 'Valle de Salida & Punto de Encuentro',
    zone: 'Sabana',
    temp: 16.5,
    windSpeed: 10,
    pressureHpa: 746,
    o2Percent: 74,
    thermalSensation: 15.8,
    clothing: 'Ropa cómoda deportiva y calzado de trekking listo en morral.',
    advice: 'Inicia hidratándote con 500ml de agua y desayuna carbohidratos complejos.'
  },
  {
    altitude: 3100,
    name: 'Piedras Gordas / Monterredondo',
    location: 'Caseta de Control & Entrada PNN Chingaza',
    zone: 'Bosque Altoandino',
    temp: 11.2,
    windSpeed: 16,
    pressureHpa: 698,
    o2Percent: 70,
    thermalSensation: 9.5,
    clothing: 'Primera capa transpirable + polar térmico intermedio y gorro.',
    advice: 'Charla técnica de Parques Nacionales. Ajuste de bastones a 90 grados.'
  },
  {
    altitude: 3650,
    name: 'Lagunas de Siecha / Buitrago',
    location: 'Santuario Lacustre & Reino de Frailejones',
    zone: 'Subpáramo',
    temp: 6.4,
    windSpeed: 24,
    pressureHpa: 651,
    o2Percent: 65,
    thermalSensation: 3.8,
    clothing: 'Chaqueta impermeable cortaviento, guantes y buff cubrecuello.',
    advice: 'Paso paramuno continuo. Ingesta de panela o frutos secos cada 45 minutos.'
  },
  {
    altitude: 4020,
    name: 'Cuchilla de Chingaza / San Luis',
    location: 'Cumbre Panorámica 360° & Cordillera Oriental',
    zone: 'Superpáramo',
    temp: 2.1,
    windSpeed: 34,
    pressureHpa: 618,
    o2Percent: 61,
    thermalSensation: -2.4,
    clothing: 'Tercera capa técnica completa resistente a llovizna helada y viento recio.',
    advice: 'Máxima exigencia cardiovascular. Respiración rítmica y mantenerse pegado al grupo.'
  }
];

export const ParamoAltitudeSimulator: React.FC = () => {
  const [altitude, setAltitude] = useState<number>(3650);

  // Compute interpolated atmospheric values based on altitude
  // T approx: 16.5 at 2600m to 2.1 at 4020m (-6.5°C per 1000m approx)
  const currentTemp = Number((16.5 - ((altitude - 2600) / 1000) * 10.1).toFixed(1));
  const currentPressure = Math.round(746 - ((altitude - 2600) / (4020 - 2600)) * (746 - 618));
  const currentO2 = Math.round(74 - ((altitude - 2600) / (4020 - 2600)) * (74 - 61));
  const currentWind = Math.round(10 + ((altitude - 2600) / (4020 - 2600)) * 24);
  const currentThermalSensation = Number((currentTemp - (currentWind * 0.15)).toFixed(1));

  // Find nearest waypoint for descriptions
  const currentWaypoint = WAYPOINTS.reduce((prev, curr) => {
    return Math.abs(curr.altitude - altitude) < Math.abs(prev.altitude - altitude) ? curr : prev;
  });

  // Calculate thermometer mercury height percentage (-5°C is 0%, 25°C is 100%)
  const minT = -5;
  const maxT = 25;
  const tempClamped = Math.min(maxT, Math.max(minT, currentTemp));
  const mercuryHeightPercent = Math.round(((tempClamped - minT) / (maxT - minT)) * 100);

  // Liquid color based on temp
  const getMercuryGradient = (t: number) => {
    if (t <= 4) return 'from-[#0284c7] via-[#38bdf8] to-[#67e8f9]'; // Icy glacier blue
    if (t <= 10) return 'from-[#0d9488] via-[#10b981] to-[#dceb6b]'; // Paramo emerald-lime
    return 'from-[#16a34a] via-[#65a30d] to-[#eab308]'; // Mild temperate
  };

  // Barometer needle angle (from -120deg at 600 hPa to +120deg at 760 hPa)
  const pressureRatio = Math.max(0, Math.min(1, (currentPressure - 600) / (760 - 600)));
  const needleAngle = -120 + pressureRatio * 240;

  return (
    <div className="w-full bg-[#13201a] text-white rounded-3xl p-6 sm:p-10 border border-[#233c32] shadow-2xl relative overflow-hidden flex flex-col gap-8">
      
      {/* Background Topo & Mist decorative subtle layers */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#dceb6b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#38bdf8]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6 relative z-10">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 bg-[#dceb6b]/15 border border-[#dceb6b]/40 px-3.5 py-1.5 rounded-full w-fit">
            <Sparkles className="size-3.5 text-[#dceb6b]" />
            <span className="text-xs font-bold text-[#dceb6b] uppercase tracking-wider">
              Simulador Altitudinal & Gradiente Térmico
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black font-['Outfit:Bold'] text-white tracking-tight">
            Perfil de Montaña, Presión & Termómetro Paramuno
          </h3>

          <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
            Explora de manera interactiva cómo varían la temperatura, la presión barométrica y la disponibilidad de oxígeno a medida que asciendes por los diferentes pisos térmicos del PNN Chingaza.
          </p>
        </div>

        {/* Quick Waypoints Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {WAYPOINTS.map((wp) => (
            <button
              key={wp.altitude}
              onClick={() => setAltitude(wp.altitude)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                altitude === wp.altitude
                  ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              }`}
            >
              <Mountain className="size-3.5" />
              <span>{wp.altitude}m</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Interactive Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* ── COL 1: MOUNTAIN PROFILE & ALTITUDE SLIDER (5 COLS) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-black/25 backdrop-blur-md p-6 rounded-3xl border border-white/10">
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#dceb6b] block">
                Cota de Altitud Seleccionada
              </span>
              <span className="text-3xl font-black font-['Outfit:Bold'] text-white">
                {altitude.toLocaleString('es-CO')} <span className="text-lg font-normal text-white/60">m s. n. m.</span>
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
              Zona: {currentWaypoint.zone}
            </span>
          </div>

          {/* Interactive SVG Mountain Contour Profile */}
          <div className="relative w-full h-48 bg-gradient-to-b from-[#173026] to-[#0c1a15] rounded-2xl p-4 overflow-hidden border border-white/10 shadow-inner flex flex-col justify-end">
            
            {/* Sun / Moon celestial hint */}
            <div className="absolute top-4 left-6 size-7 rounded-full bg-[#fef08a] opacity-80 blur-[1px] shadow-lg shadow-yellow-300/30" />
            
            {/* Distant Ridge SVG */}
            <svg viewBox="0 0 400 160" className="w-full h-full absolute inset-0 opacity-40">
              <path
                d="M0,160 L0,120 Q80,80 150,110 T300,50 Q360,20 400,70 L400,160 Z"
                fill="#204033"
              />
            </svg>

            {/* Front Peak / Ridge with Altitude Marker */}
            <svg viewBox="0 0 400 160" className="w-full h-full absolute inset-0">
              <defs>
                <linearGradient id="paramoMountain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#416b57" />
                  <stop offset="50%" stopColor="#224235" />
                  <stop offset="100%" stopColor="#11221c" />
                </linearGradient>
              </defs>
              <path
                d="M0,160 L0,130 C70,125 120,95 200,75 C270,55 330,30 400,15 L400,160 Z"
                fill="url(#paramoMountain)"
              />
              
              {/* Frailejones silhouette near high slopes */}
              <circle cx="280" cy="50" r="3" fill="#dceb6b" opacity="0.6" />
              <line x1="280" y1="50" x2="280" y2="57" stroke="#dceb6b" strokeWidth="1.5" opacity="0.6" />
              <circle cx="295" cy="45" r="3.5" fill="#dceb6b" opacity="0.7" />
              <line x1="295" y1="45" x2="295" y2="54" stroke="#dceb6b" strokeWidth="1.5" opacity="0.7" />
              <circle cx="330" cy="35" r="4" fill="#dceb6b" opacity="0.8" />
              <line x1="330" y1="35" x2="330" y2="46" stroke="#dceb6b" strokeWidth="1.5" opacity="0.8" />

              {/* Dynamic Hiker / Position Pin based on altitude slider */}
              {(() => {
                // Map altitude [2600 - 4020] to X [20 - 380] and Y [125 - 20]
                const t = (altitude - 2600) / (4020 - 2600);
                const pinX = 25 + t * 350;
                const pinY = 125 - t * 105;
                return (
                  <g className="transition-all duration-300">
                    <circle cx={pinX} cy={pinY} r="7" fill="#dceb6b" className="animate-ping opacity-75" />
                    <circle cx={pinX} cy={pinY} r="6" fill="#dceb6b" stroke="#13201a" strokeWidth="2" />
                    <circle cx={pinX} cy={pinY} r="2.5" fill="#13201a" />
                  </g>
                );
              })()}
            </svg>

            {/* In-chart info badge */}
            <div className="relative z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit text-xs flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#dceb6b] animate-pulse" />
              <span className="font-bold text-white/90">{currentWaypoint.name}</span>
            </div>
          </div>

          {/* Interactive Altitude Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>2.600m (Sabana)</span>
              <span className="font-bold text-[#dceb6b]">Desliza para cambiar cota</span>
              <span>4.020m (Cumbres)</span>
            </div>
            
            <input
              type="range"
              min="2600"
              max="4020"
              step="20"
              value={altitude}
              onChange={(e) => setAltitude(Number(e.target.value))}
              className="w-full h-2.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#dceb6b] transition-all"
            />
          </div>

          {/* Waypoint details card */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#dceb6b] font-bold">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{currentWaypoint.location}</span>
            </div>
            <p className="text-white/80 leading-relaxed text-[11px]">
              {currentWaypoint.advice}
            </p>
          </div>
        </div>

        {/* ── COL 2: LARGE ANIMATED THERMOMETER (TERMÓMETRO GRANDE) (3 COLS) ── */}
        <div className="lg:col-span-3 flex flex-col items-center bg-black/25 backdrop-blur-md p-6 rounded-3xl border border-white/10 relative">
          
          <span className="text-[10px] font-black uppercase tracking-wider text-[#dceb6b] mb-1">
            Termómetro Paramuno
          </span>
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-4xl font-black font-['Outfit:Bold'] tracking-tight">
              {currentTemp > 0 ? `+${currentTemp}` : currentTemp}°C
            </span>
          </div>
          <span className="text-[11px] text-white/60 mb-4">
            Sensación térmica: {currentThermalSensation > 0 ? `+${currentThermalSensation}` : currentThermalSensation}°C
          </span>

          {/* Physical Thermometer Glass Tube Container */}
          <div className="relative flex items-center justify-center py-2">
            
            {/* Scale markings on the Left (°C) */}
            <div className="flex flex-col justify-between h-64 text-[10px] text-white/50 pr-3 font-mono text-right select-none">
              <span>25°C</span>
              <span>20°C</span>
              <span>15°C</span>
              <span>10°C</span>
              <span>5°C</span>
              <span>0°C</span>
              <span>-5°C</span>
            </div>

            {/* Glass Tube Outer Shell */}
            <div className="relative w-8 h-64 bg-white/10 rounded-t-full rounded-b-none border-2 border-white/30 backdrop-blur-sm p-1 flex flex-col justify-end shadow-2xl overflow-hidden">
              
              {/* Internal scale ticks overlay */}
              <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-30">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-white" />
                ))}
              </div>

              {/* Rising Liquid Column (Mercury / Glacier alcohol) */}
              <div
                style={{ height: `${mercuryHeightPercent}%` }}
                className={`w-full rounded-t-full bg-gradient-to-t ${getMercuryGradient(currentTemp)} transition-all duration-500 ease-out relative shadow-lg shadow-emerald-500/20`}
              >
                {/* Micro bubbles rising effect */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-white/80 animate-ping" />
              </div>
            </div>

            {/* Scale markings on the Right (°F) */}
            <div className="flex flex-col justify-between h-64 text-[10px] text-white/50 pl-3 font-mono select-none">
              <span>77°F</span>
              <span>68°F</span>
              <span>59°F</span>
              <span>50°F</span>
              <span>41°F</span>
              <span>32°F</span>
              <span>23°F</span>
            </div>
          </div>

          {/* Thermometer Bulb Base */}
          <div className="relative -mt-2 size-14 rounded-full bg-gradient-to-b from-[#10b981] to-[#047857] border-2 border-white/40 shadow-xl flex items-center justify-center">
            <Thermometer className="size-6 text-white animate-pulse" />
            <div className="absolute inset-1 rounded-full border border-white/30 pointer-events-none" />
          </div>

          {/* Quick status caption */}
          <div className="mt-4 text-center">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              currentTemp < 4 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' 
                : 'bg-[#dceb6b]/20 text-[#dceb6b] border border-[#dceb6b]/30'
            }`}>
              {currentTemp < 4 ? '❄️ Helada Andina' : currentTemp < 10 ? '🍃 Frío Paramuno Típico' : '🌤️ Templado'}
            </span>
          </div>

        </div>

        {/* ── COL 3: BAROMETRIC PRESSURE & OXYGEN GAUGE (4 COLS) ── */}
        <div className="lg:col-span-4 flex flex-col gap-5 bg-black/25 backdrop-blur-md p-6 rounded-3xl border border-white/10">
          
          {/* Pressure Gauge Card */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
            {/* Circular Gauge Graphic */}
            <div className="relative size-18 rounded-full border-2 border-white/20 bg-black/40 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="size-full">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" strokeDasharray="180 360" strokeLinecap="round" transform="rotate(135 50 50)" />
                <circle cx="50" cy="50" r="42" stroke="#dceb6b" strokeWidth="6" fill="none" strokeDasharray={`${pressureRatio * 180} 360`} strokeLinecap="round" transform="rotate(135 50 50)" />
                
                {/* Needle */}
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="18"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  transform={`rotate(${needleAngle} 50 50)`}
                  className="transition-transform duration-500"
                />
                <circle cx="50" cy="50" r="4" fill="#ffffff" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50">
                Presión Barométrica
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-['Outfit:Bold'] text-white">
                  {currentPressure}
                </span>
                <span className="text-xs text-white/60">hPa</span>
              </div>
              <span className="text-[11px] text-[#dceb6b]">
                {(currentPressure * 0.75006).toFixed(0)} mmHg (Baja presión)
              </span>
            </div>
          </div>

          {/* Relative Oxygen Density Card */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-white/80 font-bold">
                <Activity className="size-4 text-[#38bdf8]" />
                <span>Oxígeno Ambiental Relativo</span>
              </div>
              <span className="font-mono font-black text-[#38bdf8] text-sm">
                {currentO2}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                style={{ width: `${currentO2}%` }}
                className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] transition-all duration-500 rounded-full"
              />
            </div>
            <span className="text-[10px] text-white/50">
              Respecto al nivel del mar (100%). Disminución esperable por altitud.
            </span>
          </div>

          {/* Wind & Viento Páramo */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="size-4 text-[#dceb6b]" />
              <span className="text-xs text-white/70">Viento de Cresta</span>
            </div>
            <span className="text-sm font-bold text-white font-mono">
              {currentWind} km/h NE
            </span>
          </div>

          {/* Recommended Technical Clothing for this altitude */}
          <div className="bg-[#dceb6b]/10 border border-[#dceb6b]/30 p-4 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase text-[#dceb6b] tracking-wider flex items-center gap-1">
              <ShieldAlert className="size-3.5" />
              Indumentaria para {altitude}m:
            </span>
            <p className="text-xs text-white/90 leading-relaxed font-['Inter:Regular']">
              {currentWaypoint.clothing}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ParamoAltitudeSimulator;
