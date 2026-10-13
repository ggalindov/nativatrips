import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { Toast } from '../components/Toast';
import { ParamoAltitudeSimulator } from '../components/ParamoAltitudeSimulator';
import {
  Mountain,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  ShieldCheck,
  Check,
  MapPin,
  Clock,
  Compass,
  ArrowLeft,
  XCircle,
  HelpCircle,
  Bus,
  Sparkles,
  Copy,
  ExternalLink,
  Flame,
  Droplet,
  Layers,
  Heart,
  Navigation
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: 'ropa' | 'comida' | 'proteccion' | 'doc';
  title: string;
  desc: string;
  checked: boolean;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { 
    id: '1', 
    category: 'doc', 
    title: 'Documento de identidad original físico', 
    desc: 'Cédula o pasaporte original físico obligatorio para guardaparques en la entrada.', 
    checked: true 
  },
  { 
    id: '2', 
    category: 'ropa', 
    title: 'Botas de trekking impermeables con buen labrado', 
    desc: 'Suela antideslizante con agarre profundo para barro y roca húmeda. No tenis lisos.', 
    checked: true 
  },
  { 
    id: '3', 
    category: 'ropa', 
    title: 'Chaqueta impermeable / cortavientos transpirable', 
    desc: 'El clima de páramo tiene cambios repentinos de llovizna helada en cuestión de minutos.', 
    checked: false 
  },
  { 
    id: '4', 
    category: 'ropa', 
    title: 'Sistema de 3 capas térmicas (no algodón)', 
    desc: '1ª Capa sintética transpirable, 2ª Capa térmica (polar/fleece) y 3ª Capa impermeable exterior.', 
    checked: false 
  },
  { 
    id: '5', 
    category: 'comida', 
    title: 'Mínimo 2 litros de agua por persona', 
    desc: 'En cantimplora o termo reutilizable. Prohibido tajantemente el plástico de un solo uso.', 
    checked: false 
  },
  { 
    id: '6', 
    category: 'comida', 
    title: 'Snacks energéticos de marcha calórica', 
    desc: 'Frutos secos, chocolate amargo 70%, panela, bocadillo veleño o barras de avena.', 
    checked: false 
  },
  { 
    id: '7', 
    category: 'proteccion', 
    title: 'Protector solar FPS 50+ y protector labial', 
    desc: 'La radiación UV en alta montaña a 3.600m quema fuertemente incluso bajo niebla densa.', 
    checked: false 
  },
  { 
    id: '8', 
    category: 'ropa', 
    title: 'Gorra para el sol y gorro de lana/polar para el frío', 
    desc: 'Protección combinada para oscilaciones térmicas de 4°C en la mañana a 14°C al mediodía.', 
    checked: false 
  },
  { 
    id: '9', 
    category: 'proteccion', 
    title: 'Guantes térmicos de polar liviano', 
    desc: 'Esenciales para mantener la temperatura en manos durante los miradores con viento helado.', 
    checked: false 
  },
  { 
    id: '10', 
    category: 'doc', 
    title: 'Bolsa impermeable para tus propios residuos', 
    desc: 'Principio ético estricto No Deje Rastro. Toda basura, cáscara o residuo regresa a la ciudad.', 
    checked: false 
  },
];

const HOURLY_FORECAST = [
  { hour: '06:00 AM', temp: '4°C', condition: 'Bruma fría', icon: CloudRain, uv: 'Bajo (1)' },
  { hour: '08:30 AM', temp: '7°C', condition: 'Neblina ligera', icon: Wind, uv: 'Moderado (3)' },
  { hour: '11:00 AM', temp: '12°C', condition: 'Soleado parcial', icon: Sun, uv: 'Extremo (9+)' },
  { hour: '01:30 PM', temp: '14°C', condition: 'Lagunas despejadas', icon: Sun, uv: 'Muy Alto (8)' },
  { hour: '04:00 PM', temp: '9°C', condition: 'Viento paramuno', icon: Wind, uv: 'Moderado (3)' },
  { hour: '06:00 PM', temp: '5°C', condition: 'Descenso térmico', icon: CloudRain, uv: 'Nulo (0)' },
];

export const PreTourInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const { state: bookingState } = useBooking();

  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('nativa_pretour_checklist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHECKLIST;
  });
  const [activeCategory, setActiveCategory] = useState<'all' | 'ropa' | 'comida' | 'proteccion' | 'doc'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      try {
        localStorage.setItem('nativa_pretour_checklist', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleMarkAll = () => {
    const updated = checklist.map((item) => ({ ...item, checked: true }));
    setChecklist(updated);
    try {
      localStorage.setItem('nativa_pretour_checklist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setToastMessage('¡Todos los elementos marcados como listos!');
  };

  const handleResetChecklist = () => {
    const updated = checklist.map((item) => ({ ...item, checked: false }));
    setChecklist(updated);
    try {
      localStorage.setItem('nativa_pretour_checklist', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setToastMessage('Checklist reiniciado.');
  };

  const handleCopyGPS = () => {
    const coords = '4.701198, -73.856942';
    navigator.clipboard.writeText(coords);
    setToastMessage(`Coordenadas GPS (${coords}) copiadas.`);
  };

  const completedCount = checklist.filter((item) => item.checked).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // SVG Circular Meter math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Filter checklist
  const filteredList = checklist.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="bg-[#f5f1e7] flex flex-col items-start w-full min-h-screen text-[#13201a] bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}



      {/* ── HERO BANNER PRE-TOUR ── */}
      <section className="relative w-full bg-[#13201a] text-white px-6 sm:px-12 lg:px-20 py-16 flex flex-col gap-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            alt="Páramo Chingaza"
            src="/assets/b373a.png"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex flex-col gap-3 max-w-3xl animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#dceb6b]/15 border border-[#dceb6b]/40 px-3.5 py-1.5 rounded-full w-fit">
            <Sparkles className="size-3.5 text-[#dceb6b]" />
            <span className="text-xs font-bold text-[#dceb6b] uppercase tracking-wider">
              Guía Oficial de Preparación y Seguridad
            </span>
          </div>

          <h1 className="font-['Outfit:Black'] font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
            Prepara tu visita a Chingaza
          </h1>

          <p className="text-sm sm:text-lg text-white/80 font-['Inter:Regular'] leading-relaxed">
            Reúne tu equipaje técnico, conoce el microclima de páramo y previene el mal de altura para que tu vivencia en el santuario hídrico sea segura e inspiradora.
          </p>
        </div>

        {/* Live Booking Context Badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-white max-w-fit">
          <div>
            <span className="text-white/50 block text-[10px] uppercase font-bold">Código de Reserva:</span>
            <span className="font-mono font-black text-[#dceb6b] text-sm">{bookingState.bookingCode}</span>
          </div>
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <div>
            <span className="text-white/50 block text-[10px] uppercase font-bold">Sendero Asignado:</span>
            <span className="font-semibold">{bookingState.trailName}</span>
          </div>
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <div>
            <span className="text-white/50 block text-[10px] uppercase font-bold">Fecha Programada:</span>
            <span className="font-semibold">{bookingState.trailDate}</span>
          </div>
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <div>
            <span className="text-white/50 block text-[10px] uppercase font-bold">Expedición:</span>
            <span className="font-semibold">{bookingState.memberCount} persona(s)</span>
          </div>
        </div>
      </section>

      {/* ── CUERPO PRINCIPAL: CHECKLIST & CLIMA & LOGÍSTICA ── */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-12 flex flex-col gap-12">
        
        {/* ── SECTION 1: INTERACTIVE PACKING CHECKLIST CON MEDIDOR CIRCULAR ── */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0px_8px_30px_rgba(19,32,26,0.06)] border border-[#e5e0d3] flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#eae5da] pb-6">
            <div className="flex items-start gap-4">
              
              {/* Circular SVG Progress Ring */}
              <div className="relative size-24 shrink-0 flex items-center justify-center">
                <svg className="size-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#eae5da"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#13201a"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['Outfit:Black'] font-black text-xl text-[#13201a]">
                    {progressPercent}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-[#7ea56a]">Listo</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea56a]">
                  Checklist Técnico Interactivo
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13201a] font-['Outfit:Bold'] mt-0.5">
                  ¿Qué empacar en tu morral?
                </h2>
                <p className="text-xs sm:text-sm text-[#5e6c64] mt-1 max-w-md">
                  Marca los elementos listos. Es obligatorio contar con el 100% de la indumentaria básica para recibir el aval del guía en el punto de encuentro.
                </p>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                onClick={handleMarkAll}
                className="text-xs font-bold text-[#13201a] bg-[#f5f1e7] hover:bg-[#eae5da] px-3.5 py-2 rounded-xl border border-[#ded9cb] cursor-pointer transition-colors"
              >
                Marcar Todos
              </button>
              <button
                onClick={handleResetChecklist}
                className="text-xs font-bold text-[#5e6c64] hover:text-[#13201a] px-3 py-2 cursor-pointer transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#5e6c64] mr-2">Filtrar por:</span>
            {[
              { id: 'all', label: 'Todos (10)' },
              { id: 'ropa', label: 'Indumentaria & Calzado' },
              { id: 'comida', label: 'Hidratación & Comida' },
              { id: 'proteccion', label: 'Protección UV & Frío' },
              { id: 'doc', label: 'Documentos & Entorno' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#13201a] text-[#dceb6b] shadow-sm'
                    : 'bg-[#faf8f3] text-[#5e6c64] hover:text-[#13201a] border border-[#e8e4da]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {progressPercent === 100 && (
            <div className="bg-[#e8f5e9] border border-[#a5d6a7] p-4 rounded-2xl flex items-center gap-3 text-sm text-[#2e7d32] font-bold animate-scale-in">
              <CheckCircle2 className="size-6 shrink-0" />
              <span>¡Felicitaciones! Tienes tu equipaje 100% listo para la alta montaña. ¡Nos vemos en Chingaza!</span>
            </div>
          )}

          {/* Checklist interactive items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer ${
                  item.checked
                    ? 'bg-[#faf8f3] border-[#13201a] shadow-sm'
                    : 'bg-white border-[#e5dfd2] hover:border-[#b0b7af]'
                }`}
              >
                <div className={`size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                  item.checked ? 'bg-[#13201a] border-[#13201a]' : 'border-[#cfcebf] bg-white'
                }`}>
                  {item.checked && <Check className="size-3.5 text-[#dceb6b]" />}
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-bold transition-colors ${
                    item.checked ? 'text-[#13201a] line-through opacity-70' : 'text-[#13201a]'
                  }`}>
                    {item.title}
                  </span>
                  <span className="text-xs text-[#5e6c64] leading-relaxed">
                    {item.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── SIMULADOR DE GRADIENTE ALTITUDINAL & TERMÓMETRO GIGANTE ── */}
        <ParamoAltitudeSimulator />

        {/* ── SECTION 2: METEOROLOGICAL FORECAST & HOURLY TEMPERATURE CURVE ── */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-[#e5e0d3] flex flex-col gap-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#eae5da] pb-6">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea56a]">
                Estación Meteorológica Chingaza
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                Comportamiento Térmico & Clima en la Jornada
              </h3>
              <p className="text-xs sm:text-sm text-[#5e6c64] mt-1">
                Pronóstico estimado para la altitud de 3.200 a 3.650 metros sobre el nivel del mar.
              </p>
            </div>

            <div className="bg-[#f5f1e7] px-4 py-2 rounded-2xl border border-[#e2dcd0] flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2e7d32] animate-pulse" />
              <span className="text-xs font-bold text-[#13201a]">Condiciones Aptas para Senderismo</span>
            </div>
          </div>

          {/* Quick weather summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex items-center gap-3">
              <div className="bg-[#dceb6b] p-2.5 rounded-xl text-[#13201a]">
                <Thermometer className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#55665c] block">Promedio</span>
                <span className="text-lg font-black text-[#13201a]">9°C — 14°C</span>
              </div>
            </div>

            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex items-center gap-3">
              <div className="bg-[#dceb6b] p-2.5 rounded-xl text-[#13201a]">
                <Sun className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#55665c] block">Índice Solar</span>
                <span className="text-lg font-black text-[#13201a]">UV 9+ (Extremo)</span>
              </div>
            </div>

            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex items-center gap-3">
              <div className="bg-[#dceb6b] p-2.5 rounded-xl text-[#13201a]">
                <Wind className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#55665c] block">Viento Páramo</span>
                <span className="text-lg font-black text-[#13201a]">18 km/h NE</span>
              </div>
            </div>

            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex items-center gap-3">
              <div className="bg-[#dceb6b] p-2.5 rounded-xl text-[#13201a]">
                <Droplet className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#55665c] block">Humedad</span>
                <span className="text-lg font-black text-[#13201a]">88% Relativa</span>
              </div>
            </div>
          </div>

          {/* Hourly Timeline Grid */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#13201a] uppercase tracking-wider">
              Evolución Hora a Hora Durante el Tour
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {HOURLY_FORECAST.map((slot, i) => {
                const IconComponent = slot.icon;
                return (
                  <div
                    key={i}
                    className="bg-[#faf8f3] p-3.5 rounded-2xl border border-[#ede8dd] flex flex-col items-center text-center gap-2 hover:border-[#13201a] transition-colors"
                  >
                    <span className="text-[11px] font-bold text-[#55665c]">{slot.hour}</span>
                    <div className="bg-white p-2 rounded-xl shadow-xs text-[#13201a]">
                      <IconComponent className="size-5 text-[#7ea56a]" />
                    </div>
                    <span className="font-['Outfit:Bold'] font-bold text-lg text-[#13201a]">
                      {slot.temp}
                    </span>
                    <span className="text-[11px] text-[#5e6c64] leading-tight">
                      {slot.condition}
                    </span>
                    <span className="text-[9px] font-bold text-[#7ea56a] bg-white px-2 py-0.5 rounded-full border border-[#ece7dc]">
                      UV: {slot.uv}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── SECTION 3: SOROCHE (MAL DE ALTURA) & GPS TRAILHEAD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card: Prevención Mal de Altura (Soroche) */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#e5e0d3] flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#fef3c7] p-2.5 rounded-2xl text-[#b45309]">
                <Heart className="size-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#b45309]">
                  Salud en Alta Montaña
                </span>
                <h3 className="text-xl font-bold font-['Outfit:Bold'] text-[#13201a]">
                  Prevención del Mal de Altura
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5e6c64] leading-relaxed">
              En Chingaza estarás caminando entre los 3.200 y 3.900 metros. A esta altitud la presión de oxígeno es menor. Sigue estas 4 reglas de oro:
            </p>

            <div className="flex flex-col gap-3">
              <div className="bg-[#faf8f3] p-3.5 rounded-xl border border-[#ece7dc] flex items-start gap-3">
                <Flame className="size-4 text-[#7ea56a] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#13201a]">Paso Paramuno Constante</span>
                  <span className="text-[11px] text-[#5e6c64]">Pasos cortos y ritmo constante. Evita trotar o acelerar en las subidas.</span>
                </div>
              </div>

              <div className="bg-[#faf8f3] p-3.5 rounded-xl border border-[#ece7dc] flex items-start gap-3">
                <Droplet className="size-4 text-[#7ea56a] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#13201a]">Hidratación en Pequeños Sorbos</span>
                  <span className="text-[11px] text-[#5e6c64]">Bebe agua cada 20 a 30 minutos sin esperar a tener sed.</span>
                </div>
              </div>

              <div className="bg-[#faf8f3] p-3.5 rounded-xl border border-[#ece7dc] flex items-start gap-3">
                <Layers className="size-4 text-[#7ea56a] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#13201a]">Alimentación Ligera Previa</span>
                  <span className="text-[11px] text-[#5e6c64]">Desayuna carbohidratos complejos (avena, panela, huevos). Evita fritos o lácteos pesados.</span>
                </div>
              </div>

              <div className="bg-[#faf8f3] p-3.5 rounded-xl border border-[#ece7dc] flex items-start gap-3">
                <AlertTriangle className="size-4 text-[#b45309] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#13201a]">Aviso Temprano al Guía</span>
                  <span className="text-[11px] text-[#5e6c64]">Si experimentas cefalea punzante o náuseas, infórmalo inmediatamente al guía certificado.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Coordenadas GPS & Cómo Llegar */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#e5e0d3] flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#dceb6b] p-2.5 rounded-2xl text-[#13201a]">
                <Navigation className="size-6" />
              </div>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea56a]">
                  Ubicación & Logística
                </span>
                <h3 className="text-xl font-bold font-['Outfit:Bold'] text-[#13201a]">
                  Coordenadas GPS del Sendero
                </h3>
              </div>
            </div>

            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#55665c] uppercase">Punto de Control Principal</span>
              <span className="font-bold text-sm text-[#13201a]">{bookingState.meetingPoint}</span>
              
              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-[#ded9cb] mt-1">
                <span className="font-mono font-bold text-xs text-[#13201a]">
                  4°42'04.3"N 73°51'25.0"W
                </span>
                <button
                  onClick={handleCopyGPS}
                  className="bg-[#13201a] hover:bg-black text-[#dceb6b] text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Copy className="size-3" />
                  <span>Copiar GPS</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#5e6c64]">
              <p><strong>Desde Bogotá:</strong> Toma la ruta por La Calera hacia Guasca o Choachí según el sector. Tiempo estimado de viaje: 2 horas y 15 minutos.</p>
              <p><strong>Vehículo recomendado:</strong> Campero o camioneta con buena altura al suelo para los últimos 14 km de carretera destapada.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://maps.google.com/?q=Parque+Nacional+Natural+Chingaza"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-[#13201a] hover:bg-black text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Compass className="size-3.5" />
                <span>Abrir en Google Maps</span>
              </a>

              <a
                href="https://waze.com/ul?q=Parque+Nacional+Natural+Chingaza"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-white border border-[#13201a] hover:bg-[#faf8f3] text-[#13201a] text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="size-3.5" />
                <span>Abrir en Waze</span>
              </a>
            </div>
          </div>

        </div>

        {/* ── SECTION 4: NORMAS DE CONSERVACIÓN ESTRICTAS ── */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-[#e5e0d3] flex flex-col gap-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#c62828]">
              Conservación de la Reserva de Biosfera
            </span>
            <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
              Prohibiciones Ambientales Estrictas
            </h3>
            <p className="text-xs sm:text-sm text-[#5e6c64] mt-1">
              El incumplimiento de estas normas acarrea sanción pecuniaria y expulsión inmediata según la Ley 1333 de Delitos Ambientales.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: 'Cero Plásticos de un Solo Uso', desc: 'Prohibidas bolsas plásticas, botellas descartables o pitillos.' },
              { title: 'Prohibido Mascotas de Toda Especie', desc: 'Alteran la fauna silvestre (osos andinos, venados y dantas).' },
              { title: 'Prohibido Música o Bafles Portátiles', desc: 'El silencio del páramo es patrimonio de todos los visitantes.' },
              { title: 'Prohibido Tocar o Arrancar Frailejones', desc: 'Crecen solo 1 cm al año y capturan la niebla para dar agua a 10M de personas.' },
              { title: 'Prohibido Drones sin Permiso PNN', desc: 'El zumbido desorienta a las aves endémicas y al cóndor andino.' },
              { title: 'Cero Fogatas o Colillas de Cigarrillo', desc: 'Riesgo inminente de incendios forestales en la vegetación pajonal.' },
            ].map((rule, idx) => (
              <div key={idx} className="bg-[#fef2f2] p-4 rounded-2xl border border-[#fecaca] flex items-start gap-3">
                <XCircle className="size-4 text-[#c62828] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-[#991b1b]">{rule.title}</span>
                  <span className="text-[11px] text-[#7f1d1d] leading-relaxed mt-0.5">{rule.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BANNER FINAL: VOLVER AL VOUCHER ── */}
        <div className="bg-[#13201a] text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#dceb6b] uppercase">¿Todo preparado para tu visita?</span>
            <h3 className="text-2xl font-bold font-['Outfit:Bold']">Revisa o imprime tu comprobante oficial</h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl">
              Recuerda llevar tu código de reserva impreso o descargado en el teléfono antes de salir de la ciudad, ya que en el páramo la cobertura celular es limitada.
            </p>
          </div>

          <button
            onClick={() => navigate('/confirmacion')}
            className="bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-sm px-8 py-4 rounded-full flex items-center gap-2 shrink-0 cursor-pointer shadow-lg transition-all"
          >
            <span>Ver Pase de Abordaje</span>
            <ArrowLeft className="size-4 rotate-180" />
          </button>
        </div>

      </main>

    </div>
  );
};

export default PreTourInfoPage;
