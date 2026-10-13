import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { TRAILS_DATA } from '../data/trailsData';
import { Toast } from '../components/Toast';
import { 
  Mountain, 
  ArrowUpRight, 
  Clock, 
  Route as RouteIcon, 
  CloudRain, 
  Droplet, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Compass, 
  MapPin, 
  Camera, 
  Phone, 
  Mail, 
  ShieldCheck,
  ChevronRight,
  Sparkles,
  TreePine,
  Wind,
  HeartHandshake,
  Star,
  Quote
} from 'lucide-react';

import imgPortada from '../assets/portada.png';
import imgFotografiaGuia from '../assets/guia-de-visita.png';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { selectTrailById, setMemberCount } = useBooking();
  const { user, isAuthenticated } = useAuth();

  // Quick booking widget state
  const [selectedTrailId, setSelectedTrailId] = useState('lagunas-de-siecha');
  const [selectedDate, setSelectedDate] = useState('Sáb 14 Dic 2025, 6:00 AM');
  const [visitorCount, setVisitorCount] = useState(2);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'lagunas' | 'bosque' | 'alta-montana'>('todos');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active trail in widget
  const currentTrail = TRAILS_DATA.find((t) => t.id === selectedTrailId) || TRAILS_DATA[0];

  // Submit quick booking
  const handleQuickBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    selectTrailById(selectedTrailId, selectedDate);
    setMemberCount(visitorCount);
    setToastMessage(`¡Disponibilidad confirmada para ${currentTrail.name}! Redirigiendo a tu reserva...`);
    setTimeout(() => {
      navigate('/reservas');
    }, 600);
  };

  // Filtered preview based on creative category
  const filteredCategoryTrails = TRAILS_DATA.filter((t) => {
    if (activeCategory === 'lagunas') return t.name.toLowerCase().includes('laguna') || t.name.toLowerCase().includes('siecha');
    if (activeCategory === 'bosque') return t.name.toLowerCase().includes('bosque') || t.name.toLowerCase().includes('arboleda') || t.name.toLowerCase().includes('retiro');
    if (activeCategory === 'alta-montana') return t.difficulty === 'Exigente' || t.difficulty === 'Difícil';
    return true;
  }).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#f5f1e7] text-[#13201a] overflow-x-hidden bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ── 1. PORTADA & HERO SECTION CON BRUMA Y IDENTIDAD PÁRAMO ── */}
      <section className="relative w-full min-h-[95vh] flex flex-col justify-between p-6 sm:p-12 lg:px-20 lg:py-12 text-white">
        
        {/* Background Image with Depth & Tone Gradient */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            alt="Chingaza Páramo" 
            src={imgPortada} 
            className="w-full h-full object-cover scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c2b25]/70 via-[#0c2b25]/80 to-[#0c2b25]" />
          
          {/* Subtle Ambient Paramuno Mist Layer */}
          <div className="absolute inset-0 opacity-20 bg-topo-dark" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-[#ddeb8a]/5 to-transparent animate-mist pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 size-96 bg-[#ddeb8a]/10 rounded-full blur-3xl pointer-events-none" />
        </div>



        {/* Hero Message Content with Brand Typography */}
        <div className="relative z-10 flex flex-col gap-6 max-w-3xl my-auto pt-14 pb-10 animate-fade-in">
          
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full w-fit">
            <span className="size-2 rounded-full bg-[#ddeb8a] animate-ping" />
            <p className="font-['Inter:Bold'] font-bold text-xs uppercase tracking-wider text-[#ddeb8a]">
              Parque Nacional Natural Chingaza · Operador Ecoturístico Oficial
            </p>
          </div>

          <h1 className="font-['Outfit:Black'] font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-white drop-shadow-sm">
            Camina donde <br />
            <span className="text-[#ddeb8a] underline decoration-[#ddeb8a]/30 decoration-wavy underline-offset-8">
              nace el agua
            </span>
          </h1>

          <p className="font-['Inter:Regular'] font-normal text-base sm:text-xl text-white/85 leading-relaxed max-w-xl">
            Explora el corazón hídrico de los Andes con reservas transparentes, cupos ecológicos certificados por Parques Nacionales e información clara para proteger cada paso.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              onClick={() => navigate('/senderos')}
              className="bg-[#ddeb8a] hover:bg-[#c9d870] active:scale-95 text-[#0c2b25] font-['Outfit:Bold'] font-bold px-8 py-4 rounded-full flex items-center gap-2.5 shadow-2xl transition-all duration-200 cursor-pointer text-base animate-pulse-glow"
            >
              <span>Explorar senderos autorizados</span>
              <ArrowUpRight className="size-5" />
            </button>

            <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm pl-2">
              <CheckCircle2 className="size-4 text-[#ddeb8a]" />
              <span>Cupos limitados por impacto ambiental</span>
              <span className="text-white/40">·</span>
              <span>Confirmación 100% digital</span>
            </div>
          </div>
        </div>

        {/* Hero Bottom Badges with Visual Accent Cards */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <span className="font-['Unbounded:Black'] font-black text-[#ddeb8a] text-2xl">13</span>
            <div className="text-xs text-white/80">
              <span className="font-bold block text-white">Rutas Habilitadas</span>
              <span>Páramo y bosque andino</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <span className="font-['Unbounded:Black'] font-black text-[#ddeb8a] text-2xl">3.9k</span>
            <div className="text-xs text-white/80">
              <span className="font-bold block text-white">Metros de Altitud</span>
              <span>Monitoreo de seguridad</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <span className="font-['Unbounded:Black'] font-black text-[#ddeb8a] text-2xl">100%</span>
            <div className="text-xs text-white/80">
              <span className="font-bold block text-white">Guías Nativos</span>
              <span>Comunidades campesinas</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
            <span className="font-['Unbounded:Black'] font-black text-[#ddeb8a] text-2xl">PNN</span>
            <div className="text-xs text-white/80">
              <span className="font-bold block text-white">Reserva de Biosfera</span>
              <span>Turismo regenerativo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SECCIÓN EXPERIENCIAS & SENDEROS DESTACADOS ── */}
      <section id="experiencias" className="py-24 px-6 sm:px-12 lg:px-20 w-full max-w-7xl mx-auto flex flex-col gap-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#7ea56a]">
              <Sparkles className="size-4" />
              <span>Rutas para conectar con el páramo</span>
            </div>
            <h2 className="font-['Outfit:Bold'] font-bold text-3xl sm:text-5xl text-[#17221e] tracking-tight">
              Encuentra tu sendero en Chingaza
            </h2>
            <p className="text-sm sm:text-base text-[#5e6c64] max-w-xl">
              Filtra por tipo de experiencia y descubre caminos sagrados muiscas, lagunas glaciares y senderos de niebla.
            </p>
          </div>

          {/* Interactive Category Chips */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#e2dcd0] shadow-sm flex-wrap self-start md:self-auto">
            <button
              onClick={() => setActiveCategory('todos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'todos' ? 'bg-[#13201a] text-white shadow-sm' : 'text-[#5e6c64] hover:text-[#13201a]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveCategory('lagunas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'lagunas' ? 'bg-[#13201a] text-white shadow-sm' : 'text-[#5e6c64] hover:text-[#13201a]'
              }`}
            >
              Lagunas Sagradas
            </button>
            <button
              onClick={() => setActiveCategory('bosque')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'bosque' ? 'bg-[#13201a] text-white shadow-sm' : 'text-[#5e6c64] hover:text-[#13201a]'
              }`}
            >
              Bosques de Niebla
            </button>
            <button
              onClick={() => setActiveCategory('alta-montana')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'alta-montana' ? 'bg-[#13201a] text-white shadow-sm' : 'text-[#5e6c64] hover:text-[#13201a]'
              }`}
            >
              Alta Exigencia
            </button>
          </div>
        </div>

        {/* Trail Cards Grid with Interactive Elevation and Hover Microinteractions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {filteredCategoryTrails.map((trail) => (
            <div
              key={trail.id}
              onClick={() => {
                selectTrailById(trail.id);
                navigate(`/senderos/${trail.id}`);
              }}
              className="brand-card group overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              {/* Photo header */}
              <div className="relative h-64 w-full overflow-hidden bg-zinc-900">
                <img
                  alt={trail.name}
                  src={trail.image}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-[#ddeb8a] border border-white/10 shadow-sm">
                  {trail.difficulty}
                </div>
                <div className="absolute bottom-3 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-medium text-white/90 flex items-center gap-1.5">
                  <MapPin className="size-3 text-[#ddeb8a]" />
                  <span>{trail.sector}</span>
                </div>
              </div>

              {/* Info body */}
              <div className="p-7 flex flex-col gap-4 flex-1 justify-between">
                <div>
                  <h3 className="font-['Outfit:Bold'] font-bold text-2xl text-[#17221e] group-hover:text-[#173f35] transition-colors">
                    {trail.name}
                  </h3>
                  <p className="text-xs text-[#5e6c64] line-clamp-2 mt-2 leading-relaxed">
                    {trail.description}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-3 border-t border-[#f0ece2] text-sm text-[#17221e]">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[#7ea56a]" />
                    <span className="font-semibold text-xs">{trail.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RouteIcon className="size-4 text-[#7ea56a]" />
                    <span className="font-semibold text-xs">{trail.distance}</span>
                  </div>
                  <div className="ml-auto text-xs font-extrabold text-[#173f35] bg-[#dceb6b]/20 px-2.5 py-1 rounded-lg">
                    ${trail.pricePerPerson.toLocaleString('es-CO')}
                  </div>
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[#7ea56a] font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#7ea56a] animate-ping" />
                    Cupos disponibles
                  </span>
                  <span className="font-['Outfit:Bold'] font-bold text-sm text-[#173f35] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver sendero →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate('/senderos')}
            className="bg-[#173f35] hover:bg-[#0c2b25] active:scale-95 text-white font-['Outfit:Bold'] font-bold text-sm sm:text-base px-8 py-4 rounded-full flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <span>Ver el Catálogo Completo de 13 Senderos</span>
            <ArrowUpRight className="size-5" />
          </button>
        </div>
      </section>

      {/* ── 3. GUIA DE VISITA Y SEGURIDAD CON DETALLES CREATIVOS ── */}
      <section id="guia-visita" className="py-24 px-6 sm:px-12 lg:px-20 w-full bg-[#ede8dc] border-y border-[#dfd9cc] relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Image with altitude badge & floating accent */}
          <div className="lg:col-span-6 relative h-[440px] sm:h-[520px] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              alt="Visitante en Chingaza" 
              src={imgFotografiaGuia} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="bg-[#0c2b25]/90 backdrop-blur-md px-4 py-2.5 rounded-full text-white text-xs sm:text-sm font-bold flex items-center gap-2 border border-white/10 shadow-lg">
                <Mountain className="size-4 text-[#ddeb8a]" />
                <span>Altitud regulada: hasta 3.900 m s. n. m.</span>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="font-['Inter:Extra_Bold'] font-extrabold text-xs uppercase tracking-wider text-[#7ea56a] flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                Antes de salir de casa
              </span>
              <h2 className="font-['Outfit:Bold'] font-bold text-3xl sm:text-4xl text-[#17221e] leading-tight">
                Prepárate para una experiencia segura en alta montaña
              </h2>
            </div>

            <div className="flex flex-col divide-y divide-[#d5ddd5]">
              <div className="py-4 flex gap-4 items-start group">
                <div className="bg-[#ddeb8a] size-11 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-md group-hover:scale-105 transition-transform">
                  <CloudRain className="size-5 text-[#0c2b25]" />
                </div>
                <div>
                  <h4 className="font-['Outfit:Bold'] font-bold text-base text-[#17221e]">
                    Temperatura y clima cambiante
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5e6c64] font-['Inter:Regular'] mt-1 leading-relaxed">
                    Viste en 3 capas térmicas e impermeables; el páramo oscila entre 4°C y 14°C con ráfagas de viento y niebla espesa que desciende sin previo aviso.
                  </p>
                </div>
              </div>

              <div className="py-4 flex gap-4 items-start group">
                <div className="bg-[#ddeb8a] size-11 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-md group-hover:scale-105 transition-transform">
                  <Droplet className="size-5 text-[#0c2b25]" />
                </div>
                <div>
                  <h4 className="font-['Outfit:Bold'] font-bold text-base text-[#17221e]">
                    Hidratación y alimento de marcha
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5e6c64] font-['Inter:Regular'] mt-1 leading-relaxed">
                    Lleva mínimo 2 litros de agua en termo reutilizable y snacks calóricos (frutos secos, panela). No existen tiendas ni cafeterías dentro de la reserva protegida.
                  </p>
                </div>
              </div>

              <div className="py-4 flex gap-4 items-start group">
                <div className="bg-[#ddeb8a] size-11 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-md group-hover:scale-105 transition-transform">
                  <AlertCircle className="size-5 text-[#0c2b25]" />
                </div>
                <div>
                  <h4 className="font-['Outfit:Bold'] font-bold text-base text-[#17221e]">
                    Cuidado estricto del ecosistema sagrado
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5e6c64] font-['Inter:Regular'] mt-1 leading-relaxed">
                    Prohibido el ingreso de plásticos desechables, mascotas y parlantes. No toques los frailejones y mantente siempre sobre los senderos demarcados del parque.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/pre-tour')}
                className="inline-flex items-center gap-2 font-['Outfit:Bold'] font-bold text-sm text-[#173f35] hover:text-[#0c2b25] transition-colors"
              >
                <span>Ver checklist completo de morral e indumentaria</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PANEL DE RESERVA RÁPIDA TOTALMENTE INTERACTIVO Y VIBRANTE ── */}
      <section className="py-24 px-6 sm:px-12 lg:px-20 w-full bg-[#0c2b25] text-white relative overflow-hidden">
        {/* Curvas topográficas concéntricas */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 size-[700px] rounded-full border border-[#ddeb8a]/10 pointer-events-none" />
        <div className="absolute -right-12 top-1/2 -translate-y-1/2 size-[500px] rounded-full border border-[#ddeb8a]/10 pointer-events-none" />
        <div className="absolute right-12 top-1/2 -translate-y-1/2 size-[300px] rounded-full border border-[#ddeb8a]/15 pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left: Heading and value prop */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-[#ddeb8a]/15 px-3 py-1.5 rounded-full w-fit border border-[#ddeb8a]/30">
              <Sparkles className="size-3.5 text-[#ddeb8a]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#ddeb8a]">
                Tu próxima caminata empieza aquí
              </span>
            </div>

            <h2 className="font-['Outfit:Black'] font-black text-3xl sm:text-5xl leading-tight">
              Reserva tu entrada a Chingaza sin complicaciones
            </h2>

            <p className="font-['Inter:Regular'] font-normal text-base text-white/80 leading-relaxed max-w-lg">
              Elige el sendero, la fecha y la cantidad de visitantes. Te garantizamos cupos oficiales autorizados por Parques Nacionales Naturales de Colombia con confirmación inmediata.
            </p>

            <div className="flex flex-col gap-3 pt-2 text-sm text-[#ddeb8a]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4.5 text-[#ddeb8a]" />
                <span className="text-white/90">Póliza de asistencia médica y rescate en alta montaña incluida</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4.5 text-[#ddeb8a]" />
                <span className="text-white/90">Guía local certificado por cada grupo ecológico</span>
              </div>
            </div>
          </div>

          {/* Right: ACTUAL REAL INTERACTIVE BOOKING FORM */}
          <div className="lg:col-span-6">
            <form
              onSubmit={handleQuickBookingSubmit}
              className="bg-white text-[#13201a] p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col gap-6 border border-white/20 animate-scale-in"
            >
              <div className="border-b border-[#e5dfd5] pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#7ea56a]">
                    Formulario de Reserva Inmediata
                  </span>
                  <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                    Planifica tu visita
                  </h3>
                </div>
                <div className="bg-[#f5f1e7] px-3 py-1 rounded-full text-xs font-bold text-[#13201a]">
                  PNN Oficial
                </div>
              </div>

              {/* Input 1: Select Trail */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#5e6c64] uppercase flex items-center justify-between">
                  <span>Sendero / Destino</span>
                  <span className="text-[#7ea56a] font-normal lowercase">13 disponibles</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedTrailId}
                    onChange={(e) => {
                      setSelectedTrailId(e.target.value);
                      const t = TRAILS_DATA.find((x) => x.id === e.target.value);
                      if (t && t.availableDates.length > 0) {
                        setSelectedDate(t.availableDates[0].display);
                      }
                    }}
                    className="w-full bg-[#fbf9f4] border border-[#d5d0c2] text-[#13201a] text-sm font-semibold rounded-2xl px-4 py-3.5 outline-none focus:border-[#13201a] focus:ring-2 focus:ring-[#dceb6b]/40 cursor-pointer appearance-none transition-all"
                  >
                    {TRAILS_DATA.map((trail) => (
                      <option key={trail.id} value={trail.id}>
                        {trail.name} ({trail.difficulty} · {trail.sector})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    ▼
                  </div>
                </div>
              </div>

              {/* Input 2: Select Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#5e6c64] uppercase flex items-center justify-between">
                  <span>Fecha de Visita</span>
                  <span className="text-[#13201a] font-bold text-[11px] bg-[#dceb6b]/30 px-2 py-0.5 rounded-full">
                    {currentTrail.availableDates[0]?.slots || 6} cupos hoy
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-[#fbf9f4] border border-[#d5d0c2] text-[#13201a] text-sm font-semibold rounded-2xl px-4 py-3.5 outline-none focus:border-[#13201a] focus:ring-2 focus:ring-[#dceb6b]/40 cursor-pointer appearance-none transition-all"
                  >
                    {currentTrail.availableDates.map((d) => (
                      <option key={d.date} value={d.display}>
                        {d.display} — {d.slots} cupos restantes
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    ▼
                  </div>
                </div>
              </div>

              {/* Input 3: Visitors count selector */}
              <div className="flex items-center justify-between bg-[#fbf9f4] p-4 rounded-2xl border border-[#d5d0c2]">
                <div>
                  <p className="text-xs font-bold text-[#5e6c64] uppercase">Integrantes</p>
                  <p className="text-sm font-semibold text-[#13201a]">¿Cuántas personas van?</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                    className="size-9 rounded-xl bg-white border border-[#d5d0c2] text-lg font-bold flex items-center justify-center hover:bg-[#e8e4da] active:scale-95 transition-all cursor-pointer"
                  >
                    –
                  </button>
                  <span className="font-extrabold text-lg w-6 text-center text-[#13201a]">
                    {visitorCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisitorCount(Math.min(8, visitorCount + 1))}
                    className="size-9 rounded-xl bg-white border border-[#d5d0c2] text-lg font-bold flex items-center justify-center hover:bg-[#e8e4da] active:scale-95 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price summary badge */}
              <div className="bg-[#f2efe4] px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <span className="text-[#5e6c64] block">Tarifa estimada para {visitorCount} pers:</span>
                  <span className="font-['Outfit:Bold'] font-bold text-xl text-[#13201a]">
                    ${(currentTrail.pricePerPerson * visitorCount).toLocaleString('es-CO')} COP
                  </span>
                </div>
                <span className="text-xs text-[#7ea56a] font-bold">50% anticipo requerido</span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full bg-[#173f35] hover:bg-[#0c2b25] active:scale-95 text-white font-['Outfit:Bold'] font-bold text-base py-4 px-6 rounded-full flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
              >
                <span>Consultar disponibilidad y agendar</span>
                <ArrowUpRight className="size-5 text-[#ddeb8a]" />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ── 5. TESTIMONIOS Y RESEÑAS VERIFICADAS DE GOOGLE MAPS ── */}
      <section className="py-24 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto w-full flex flex-col gap-12">
        
        {/* Google Reviews Header Card */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-[#e5dfd2] shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2.5 bg-[#f8f9fa] border border-[#dadce0] px-4 py-2 rounded-full w-fit">
              <svg viewBox="0 0 24 24" className="size-4.5 shrink-0" aria-label="Google Logo">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-xs font-bold text-[#3c4043] tracking-wide">
                Reseñas verificadas de Google Maps
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#13201a] font-['Outfit:Bold'] tracking-tight">
              Lo que dicen nuestros ecoturistas
            </h2>

            <p className="text-sm text-[#5e6c64] max-w-xl">
              Experiencias auténticas de senderistas y montañistas que vivieron la magia del Parque Nacional Natural Chingaza con nosotros.
            </p>
          </div>

          {/* Rating Summary Pill */}
          <div className="flex items-center gap-4 bg-[#fbf9f4] p-4 sm:p-5 rounded-2xl border border-[#ece7dc] shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-[#13201a] font-['Outfit:Bold'] leading-none">
                4.9
              </span>
              <div className="flex gap-0.5 text-[#fbbc04] mt-1.5">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="size-3.5 fill-current" />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-[#d5d0c2]" />
            <div className="flex flex-col text-xs text-[#5e6c64]">
              <span className="font-bold text-[#13201a]">148 opiniones</span>
              <span>En Google Business</span>
              <span className="text-[11px] text-[#2e7d32] font-semibold mt-0.5">● Perfil Verificado</span>
            </div>
          </div>
        </div>

        {/* Google Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              author: 'Carolina Morales',
              avatarText: 'CM',
              avatarBg: 'bg-[#e8f0fe] text-[#1967d2]',
              badge: 'Local Guide · Nivel 6 · 48 reseñas',
              time: 'Hace 2 semanas',
              trail: 'Lagunas de Siecha',
              text: 'Las Lagunas de Siecha te dejan sin palabras. El acompañamiento de NativaTrips fue perfecto: nos cuidaron con la altitud y aprendimos el valor sagrado que los muiscas daban al agua. Los guías van a tu propio ritmo y están súper pendientes de la conservación del páramo.',
              reply: '¡Muchas gracias Carolina! Cuidar el agua y la memoria ancestral muisca es el alma de cada expedición. ¡Esperamos verte pronto en Suasie!'
            },
            {
              author: 'Esteban Valencia',
              avatarText: 'EV',
              avatarBg: 'bg-[#fef7e0] text-[#b06000]',
              badge: 'Local Guide · 12 reseñas',
              time: 'Hace 1 mes',
              trail: 'Sendero Suasie',
              text: 'Hicimos el sendero Suasie en familia. Los niños aprendieron sobre los frailejones y la organización del transporte desde Bogotá fue impecable y puntual. El trámite de permisos oficiales ante Parques Nacionales fue 100% transparente.',
              reply: '¡Qué gran honor recibir a tu familia, Esteban! Formar a las nuevas generaciones en el amor y protección del frailejón es nuestra mayor recompensa.'
            },
            {
              author: 'Felipe Sandoval',
              avatarText: 'FS',
              avatarBg: 'bg-[#e6f4ea] text-[#137333]',
              badge: 'Local Guide · Nivel 5 · 26 reseñas',
              time: 'Hace 3 semanas',
              trail: 'Cuchilla el Zaque',
              text: 'Cuchilla el Zaque es exigente pero la vista de 360 grados de la cordillera es una locura. El proceso de reserva y pago fue sumamente rápido. La póliza de asistencia médica y los refrigerios energéticos nos dieron total tranquilidad.',
              reply: '¡Tremendo ascenso Felipe! La cumbre del Zaque exige temple andino. Gracias por caminar con nosotros y respetar el santuario hídrico.'
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-7 rounded-3xl border border-[#e5dfd2] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-5 relative group"
            >
              {/* Header with Google Brand & Reviewer */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-full ${item.avatarBg} font-black text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                    {item.avatarText}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#13201a] leading-tight">
                      {item.author}
                    </span>
                    <span className="text-[11px] text-[#5f6368] font-medium leading-tight">
                      {item.badge}
                    </span>
                  </div>
                </div>

                {/* Google Mini Icon */}
                <div className="p-1 rounded-md bg-[#f8f9fa] border border-[#f1f3f4]" title="Reseña verificada en Google Maps">
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              </div>

              {/* Stars & Relative Date */}
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5 text-[#fbbc04]">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-[#70757a]">{item.time}</span>
              </div>

              {/* Trail badge */}
              <div className="w-fit bg-[#f5f1e7] text-[#13201a] text-[11px] font-bold px-3 py-1 rounded-full border border-[#e5dfd2]">
                Expedición: {item.trail}
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-[#3c4043] leading-relaxed font-['Inter:Regular']">
                "{item.text}"
              </p>

              {/* Owner Response Box */}
              <div className="bg-[#f8f9fa] border-l-2 border-[#13201a] pl-3 py-2 pr-2 rounded-r-xl text-[11px] flex flex-col gap-1 text-[#5f6368]">
                <span className="font-bold text-[#13201a] flex items-center gap-1">
                  <span>Respuesta de NativaTrips (Propietario)</span>
                </span>
                <p className="italic text-[#5e6c64]">
                  {item.reply}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA to Google Maps */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 bg-white hover:bg-[#f8f9fa] text-[#3c4043] font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full border border-[#dadce0] shadow-sm hover:shadow transition-all"
          >
            <svg viewBox="0 0 24 24" className="size-4.5 shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Ver las 148 reseñas en Google Maps</span>
          </a>

          <button
            onClick={() => setToastMessage?.('¡Gracias por tu apoyo! Puedes dejarnos tu reseña después de tu visita guiada a Chingaza.')}
            className="inline-flex items-center gap-2 bg-[#dceb6b] hover:bg-[#cde055] text-[#13201a] font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <span>Escribir una reseña sobre tu expedición</span>
          </button>
        </div>

      </section>



    </div>
  );
};

export default HomePage;
