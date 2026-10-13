import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { TRAILS_DATA, Trail } from '../data/trailsData';
import { Toast } from '../components/Toast';
import { ParamoCalendar, AvailableDateInfo } from '../components/ParamoCalendar';
import {
  Mountain,
  ArrowUpRight,
  Gauge,
  Clock,
  Activity,
  FileText,
  User,
  Sun,
  Droplet,
  ShoppingBag,
  Compass,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Share2,
  Calendar,
  Maximize2,
  ShieldCheck,
  Check,
  MapPin,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const TrailDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { state: bookingState, selectTrailById } = useBooking();

  const currentTrail: Trail =
    TRAILS_DATA.find((t) => t.id === id) ||
    TRAILS_DATA.find((t) => t.id === bookingState.trailId) ||
    TRAILS_DATA[0];

  // Gallery photo switcher
  const galleryPhotos = [
    '/assets/2d806.png',
    '/assets/fcbe7.png',
    '/assets/fe7e4.png',
    '/assets/25b92.png',
    '/assets/e14e0.png'
  ];
  const [activePhoto, setActivePhoto] = useState(galleryPhotos[0]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected date state
  const [selectedDateObj, setSelectedDateObj] = useState(
    currentTrail.availableDates[0] || { date: '2025-12-14', display: 'Sáb 14 Dic 2025', slots: 6 }
  );

  // Active elevation point for interactive tooltip
  const [activeElevationIndex, setActiveElevationIndex] = useState<number | null>(3);

  // Accordion state
  const [openAccordion, setOpenAccordion] = useState<string | null>('itinerary');

  // Sticky booking bar trigger
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (currentTrail.id !== bookingState.trailId) {
      selectTrailById(currentTrail.id, selectedDateObj.display);
    }
  }, [currentTrail.id]);

  const handleBookNow = (dateDisplay?: string) => {
    const finalDate = dateDisplay || selectedDateObj.display;
    selectTrailById(currentTrail.id, finalDate);
    setToastMessage(`Iniciando reserva para ${currentTrail.name}...`);
    setTimeout(() => {
      navigate('/reservas');
    }, 400);
  };

  const elevationPoints = [
    { label: '3.100m', height: 50, color: '#13201a', name: 'Inicio (Piedras Gordas)', note: 'Puesto de control PNN Chingaza, aclimatación y registro obligatorio.' },
    { label: '3.420m', height: 100, color: '#13201a', name: 'Laguna de Guasca', note: 'Primer cuerpo de agua sagrado muisca y santuario de frailejones.' },
    { label: '3.560m', height: 140, color: '#13201a', name: 'Laguna Siecha', note: 'Espejo de agua glacial principal, avistamiento de venados cola blanca.' },
    { label: '3.680m', height: 180, color: '#e05a36', name: 'Mirador Sagrado (Cima)', note: 'Punto cumbre con vista panorámica de 360° a los valles andinos.' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#f5f0e8] text-[#080f0c] flex flex-col font-['Inter:Regular'] bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}



      {/* ── BREADCRUMBS ── */}
      <nav className="flex items-center gap-2 px-6 sm:px-12 lg:px-20 py-4 text-xs sm:text-sm text-[#6b7566]">
        <button onClick={() => navigate('/')} className="hover:text-[#13201a] transition-colors cursor-pointer">
          Inicio
        </button>
        <span>&gt;</span>
        <button onClick={() => navigate('/senderos')} className="hover:text-[#13201a] transition-colors cursor-pointer">
          Senderos
        </button>
        <span>&gt;</span>
        <span className="font-bold text-[#13201a] truncate max-w-[200px] sm:max-w-none">
          {currentTrail.name}
        </span>
      </nav>

      {/* ── HERO PHOTO GALLERY ── */}
      <section className="px-6 sm:px-12 lg:px-20 pb-12 flex flex-col gap-4">
        {/* Main Photo */}
        <div className="relative h-[360px] sm:h-[480px] lg:h-[540px] w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 group">
          <img
            alt={currentTrail.name}
            src={activePhoto}
            className="w-full h-full object-cover transition-all duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

          {/* Badges on hero image */}
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <span className="bg-[#13201a]/80 backdrop-blur-md text-[#dceb6b] text-xs font-extrabold uppercase px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
              {currentTrail.sector}
            </span>
            <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/10">
              Dificultad: {currentTrail.difficulty}
            </span>
          </div>

          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-6 right-6 bg-white/80 hover:bg-white text-[#13201a] text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg transition-all cursor-pointer"
          >
            <Maximize2 className="size-3.5" />
            <span>Ver foto completa</span>
          </button>
        </div>

        {/* Thumbnails Row */}
        <div className="grid grid-cols-5 gap-3 sm:gap-4">
          {galleryPhotos.map((photo, index) => {
            const isSelected = activePhoto === photo;
            return (
              <button
                key={index}
                onClick={() => setActivePhoto(photo)}
                className={`h-20 sm:h-28 rounded-2xl overflow-hidden relative transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'ring-4 ring-[#13201a] scale-102 shadow-lg'
                    : 'opacity-70 hover:opacity-100 hover:scale-101'
                }`}
              >
                <img
                  alt={`Foto ${index + 1}`}
                  src={photo}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxOpen && (
        <div 
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl">
            <img alt="Vista ampliada" src={activePhoto} className="max-w-full max-h-[90vh] object-contain" />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/70 text-white rounded-full size-10 flex items-center justify-center text-lg font-bold hover:bg-black transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── INFORMACIÓN PRINCIPAL & METRICS ── */}
      <section className="px-6 sm:px-12 lg:px-20 pb-16 flex flex-col gap-8 max-w-7xl">
        <div className="flex flex-col gap-3">
          <span className="font-['Inter:Extra_Bold'] font-extrabold text-xs uppercase tracking-widest text-[#7ea56a] flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span>{currentTrail.sector}</span>
          </span>
          <h1 className="font-['Outfit:Black'] font-black text-3xl sm:text-5xl lg:text-6xl text-[#080f0c] leading-tight">
            {currentTrail.name}
          </h1>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae5da] flex items-center gap-4">
            <div className="bg-[#dceb6b] size-12 rounded-2xl flex items-center justify-center shrink-0">
              <Gauge className="size-6 text-[#13201a]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7566]">Dificultad</p>
              <p className="text-xl font-bold font-['Outfit:Bold'] text-[#080f0c]">{currentTrail.difficulty}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae5da] flex items-center gap-4">
            <div className="bg-[#dceb6b] size-12 rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="size-6 text-[#13201a]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7566]">Duración Estimada</p>
              <p className="text-xl font-bold font-['Outfit:Bold'] text-[#080f0c]">{currentTrail.duration}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#eae5da] flex items-center gap-4">
            <div className="bg-[#dceb6b] size-12 rounded-2xl flex items-center justify-center shrink-0">
              <Activity className="size-6 text-[#13201a]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#6b7566]">Longitud Recorrido</p>
              <p className="text-xl font-bold font-['Outfit:Bold'] text-[#080f0c]">{currentTrail.distance}</p>
            </div>
          </div>
        </div>

        <p className="text-base sm:text-xl text-[#080f0c] leading-relaxed max-w-4xl font-normal">
          {currentTrail.description}
        </p>
      </section>

      {/* ── MAPA Y PERFIL DE ELEVACIÓN INTERACTIVO ── */}
      <section className="px-6 sm:px-12 lg:px-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Map Card */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae5da] flex flex-col justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase text-[#6b7566]">Situación Geográfica</span>
              <h3 className="text-2xl font-extrabold font-['Outfit:Bold'] text-[#080f0c] mt-1">Ruta y Señalización</h3>
              <p className="text-sm text-[#6b7566] mt-2 leading-relaxed">
                Punto de inicio en {currentTrail.meetingPoint}. Todo el trayecto cuenta con delimitación en cuerda ecológica y puestos de control de guardaparques.
              </p>
            </div>
            <div className="h-64 rounded-2xl overflow-hidden relative shadow-inner bg-zinc-100 border border-[#eae5da]">
              <img
                alt="Mapa satelital"
                src="/assets/12270.png"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#13201a] shadow-sm">
                GPS: 4°45'20"N 73°45'12"W · Sector Oficial
              </div>
            </div>
          </div>

          {/* Elevation Profile Card (Interactive) */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#eae5da] flex flex-col justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase text-[#6b7566]">Altitud Máxima 3.680 m.s.n.m.</span>
              <h3 className="text-2xl font-extrabold font-['Outfit:Bold'] text-[#080f0c] mt-1">Perfil de Elevación Interactivo</h3>
              <p className="text-sm text-[#6b7566] mt-1">
                Haz click en las estaciones del gráfico para ver detalles y recomendaciones de aclimatación.
              </p>
            </div>

            {/* Interactive Bars */}
            <div className="flex items-end justify-between gap-4 pt-6 pb-2 border-b border-[#eae5da]">
              {elevationPoints.map((point, idx) => {
                const isActive = activeElevationIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveElevationIndex(idx)}
                    className="flex flex-col items-center gap-2 group flex-1 cursor-pointer"
                  >
                    <span className={`text-xs font-bold transition-colors ${isActive ? 'text-[#e05a36]' : 'text-[#6b7566]'}`}>
                      {point.label}
                    </span>
                    <div
                      style={{ height: `${point.height}px` }}
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        isActive ? 'bg-[#e05a36] shadow-lg scale-105' : 'bg-[#13201a] group-hover:bg-[#2e4a3d]'
                      }`}
                    />
                    <span className={`text-[11px] font-semibold text-center truncate max-w-[80px] sm:max-w-none ${isActive ? 'text-[#080f0c]' : 'text-[#6b7566]'}`}>
                      {point.name.split(' (')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active elevation point information box */}
            {activeElevationIndex !== null && (
              <div className="bg-[#f5f1e7] p-4 rounded-2xl flex items-start gap-3 animate-fade-in border border-[#e5dfd2]">
                <Activity className="size-5 text-[#e05a36] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#080f0c]">
                    {elevationPoints[activeElevationIndex].name} — {elevationPoints[activeElevationIndex].label}
                  </p>
                  <p className="text-xs text-[#6b7566] mt-0.5">
                    {elevationPoints[activeElevationIndex].note}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── ACORDEÓN DE DETALLES TÉCNICOS E ITINERARIO ── */}
      <section className="px-6 sm:px-12 lg:px-20 pb-20 max-w-5xl mx-auto w-full">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-[#eae5da] flex flex-col gap-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea56a]">
            Información Logística y Transparencia
          </span>
          <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a]">
            Todo lo que necesitas saber de la excursión
          </h3>

          <div className="flex flex-col divide-y divide-[#f0ece2] mt-4">
            
            {/* Accordion 1: Itinerario */}
            <div className="py-4">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'itinerary' ? null : 'itinerary')}
                className="w-full flex items-center justify-between font-bold text-base text-[#13201a] text-left cursor-pointer"
              >
                <span>📅 Itinerario hora a hora de la caminata</span>
                <ChevronDown className={`size-5 text-zinc-500 transition-transform ${openAccordion === 'itinerary' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'itinerary' && (
                <div className="pt-3 text-xs sm:text-sm text-[#5e6c64] space-y-2 animate-fade-in">
                  <p>• <strong>5:00 AM:</strong> Salida del transporte oficial desde Bogotá (si fue reservado).</p>
                  <p>• <strong>6:00 AM:</strong> Encuentro en punto de control PNN, verificación de pólizas y charla técnica de guardaparques.</p>
                  <p>• <strong>6:30 AM:</strong> Inicio del ascenso guiado por el valle de frailejones.</p>
                  <p>• <strong>9:30 AM:</strong> Arribo a la primera laguna sagrada muisca y pausa de hidratación.</p>
                  <p>• <strong>11:30 AM:</strong> Cima en Mirador Sagrado (3.680m), tiempo para contemplación y fotos.</p>
                  <p>• <strong>1:00 PM:</strong> Retorno seguro al punto de inicio y almuerzo campesino.</p>
                </div>
              )}
            </div>

            {/* Accordion 2: Inclusiones */}
            <div className="py-4">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'inclusions' ? null : 'inclusions')}
                className="w-full flex items-center justify-between font-bold text-base text-[#13201a] text-left cursor-pointer"
              >
                <span>🎒 ¿Qué incluye y qué no incluye la tarifa?</span>
                <ChevronDown className={`size-5 text-zinc-500 transition-transform ${openAccordion === 'inclusions' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'inclusions' && (
                <div className="pt-3 text-xs sm:text-sm text-[#5e6c64] space-y-2 animate-fade-in">
                  <p className="text-[#2e7d32] font-semibold">✓ Incluye: Cupo oficial registrado en PNN Chingaza, póliza de rescate médico, guía local certificado, acompañamiento de guardaparques, apoyo a proyectos comunitarios.</p>
                  <p className="text-[#c62828] font-semibold">✕ No incluye: Equipo personal de montaña (botas, chaqueta), transporte opcional desde Bogotá (+$45.000 COP), almuerzo campesino (+$25.000 COP).</p>
                </div>
              )}
            </div>

            {/* Accordion 3: Políticas de Cancelación */}
            <div className="py-4">
              <button
                onClick={() => setOpenAccordion(openAccordion === 'policies' ? null : 'policies')}
                className="w-full flex items-center justify-between font-bold text-base text-[#13201a] text-left cursor-pointer"
              >
                <span>🛡️ Política de reprogramación por clima y cancelación</span>
                <ChevronDown className={`size-5 text-zinc-500 transition-transform ${openAccordion === 'policies' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'policies' && (
                <div className="pt-3 text-xs sm:text-sm text-[#5e6c64] space-y-2 animate-fade-in">
                  <p>Si las autoridades de Parques Nacionales cierran el sendero por condiciones meteorológicas extremas, tu reserva se reprograma sin ningún costo durante los siguientes 6 meses o se realiza el reembolso completo de tu anticipo.</p>
                  <p>Cancelaciones voluntarias con más de 72 horas de anticipación reciben reembolso del 100%.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── AGENDA TU VISITA (SELECCIÓN DE FECHAS CON CALENDARIO PARAMUNO) ── */}
      <section className="py-16 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#7ea56a] flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span>Cupos Regulados en Vivo</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit:Bold'] text-[#080f0c]">
            Agenda tu visita en {currentTrail.name}
          </h2>
          <p className="text-sm text-[#6b7566]">
            Selecciona en el calendario interactivo o en las fechas rápidas para asegurar tus cupos oficiales ante Parques Nacionales.
          </p>
        </div>

        {/* Calendar and Selection Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Monthly Interactive Paramo Calendar (7 cols) */}
          <div className="lg:col-span-7">
            <ParamoCalendar
              availableDates={currentTrail.availableDates}
              selectedDate={selectedDateObj.date}
              onSelectDate={(dateInfo) => setSelectedDateObj(dateInfo)}
            />
          </div>

          {/* Right: Selected Date Summary & Instant Booking Card (5 cols) */}
          <div className="lg:col-span-5 bg-white p-7 sm:p-8 rounded-3xl border-2 border-[#13201a] shadow-xl flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#eae5da] pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7ea56a]">
                  Fecha Seleccionada
                </span>
                <span className="bg-[#f5f9e8] text-[#2e7d32] border border-[#a5d6a7] text-xs px-3 py-1 rounded-full font-bold">
                  {selectedDateObj.slots} cupos restantes
                </span>
              </div>

              <div>
                <h3 className="font-['Outfit:Black'] font-black text-2xl text-[#13201a]">
                  {selectedDateObj.display}
                </h3>
                <span className="text-xs text-[#5e6c64] block mt-0.5">
                  Horario de ingreso: 6:00 AM puntual · {currentTrail.sector}
                </span>
              </div>

              <div className="bg-[#faf8f3] p-4 rounded-2xl border border-[#ece7dc] flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#5e6c64]">Tarifa oficial por visitante:</span>
                  <span className="font-bold text-[#13201a]">
                    ${currentTrail.pricePerPerson.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#5e6c64]">Seguro médico y póliza PNN:</span>
                  <span className="font-bold text-[#2e7d32]">Incluido</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#5e6c64]">Acompañamiento de guía local:</span>
                  <span className="font-bold text-[#2e7d32]">Incluido</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBookNow(selectedDateObj.display)}
              className="w-full bg-[#13201a] hover:bg-black active:scale-95 text-[#dceb6b] font-['Outfit:Bold'] font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Continuar con esta fecha</span>
              <ArrowUpRight className="size-5" />
            </button>
          </div>

        </div>

        {/* Quick Dates Shortcuts */}
        <div className="flex flex-col gap-3 pt-4">
          <span className="text-xs font-bold text-[#5e6c64] uppercase tracking-wider">
            Otras fechas autorizadas disponibles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentTrail.availableDates.map((item, i) => {
              const isSelected = selectedDateObj.date === item.date;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDateObj(item)}
                  className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#13201a] bg-[#faf8f3] ring-2 ring-[#13201a]'
                      : 'border-[#eae5da] hover:border-[#13201a]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-[#13201a]">{item.display}</span>
                    <span className="text-[10px] text-[#7ea56a]">{item.slots} cupos</span>
                  </div>
                  <span className="text-xs font-bold text-[#13201a]">
                    ${currentTrail.pricePerPerson.toLocaleString('es-CO')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── STICKY BOTTOM RESERVATION BAR ── */}
      {showStickyBar && (
        <aside 
          aria-label="Barra de Reserva Rápida"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#13201a]/95 backdrop-blur-md text-white py-3.5 px-6 sm:px-12 border-t border-[#2e4036] shadow-2xl flex items-center justify-between gap-4 animate-slide-up no-print"
        >
          <div className="flex items-center gap-4">
            <img
              alt={currentTrail.name}
              src={currentTrail.image}
              className="size-11 rounded-xl object-cover hidden sm:block"
            />
            <div>
              <span className="font-bold text-sm block">{currentTrail.name}</span>
              <span className="text-xs text-[#dceb6b]">{selectedDateObj.display} · ${currentTrail.pricePerPerson.toLocaleString('es-CO')} COP</span>
            </div>
          </div>

          <button
            onClick={() => handleBookNow()}
            className="bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-sm px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
          >
            <span>Reservar Ahora</span>
            <ArrowUpRight className="size-4" />
          </button>
        </aside>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#13201a] text-white py-16 px-6 sm:px-12 lg:px-20 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#dceb6b] size-9 rounded-xl flex items-center justify-center">
              <Mountain className="size-5 text-[#13201a]" />
            </div>
            <span className="font-extrabold text-xl">NativaTrips Colombia</span>
          </div>
          <p className="text-xs text-[#9aa8a0]">
            Operador ecoturístico autorizado por Parques Nacionales Naturales de Colombia · RNT 48291
          </p>
        </div>
      </footer>

    </div>
  );
};

export default TrailDetailPage;
