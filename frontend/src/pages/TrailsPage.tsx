import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { TRAILS_DATA, SOLD_OUT_DEMO_TRAIL, Trail } from '../data/trailsData';
import { Toast } from '../components/Toast';
import {
  Mountain,
  Search,
  Clock,
  Route as RouteIcon,
  ChevronDown,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Calendar,
  Grid,
  List,
  Eye,
  X,
  Gauge,
  MapPin,
  TrendingUp
} from 'lucide-react';

export const TrailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectTrailById } = useBooking();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Todas');
  const [selectedSector, setSelectedSector] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Quick preview modal state
  const [quickViewTrail, setQuickViewTrail] = useState<Trail | null>(null);

  // Waitlist form state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const list = Array.from(new Set(TRAILS_DATA.map((t) => t.sector.split(' · ')[0])));
    return ['Todos', ...list];
  }, []);

  // Filtered trails logic
  const filteredTrails = useMemo(() => {
    return TRAILS_DATA.filter((trail) => {
      const matchesSearch =
        searchTerm === '' ||
        trail.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trail.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trail.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        selectedDifficulty === 'Todas' || trail.difficulty === selectedDifficulty;

      const matchesSector =
        selectedSector === 'Todos' || trail.sector.toLowerCase().includes(selectedSector.toLowerCase());

      const matchesMonth =
        selectedMonth === 'Todos' ||
        trail.availableDates.some((d) =>
          selectedMonth === 'Dic 2025'
            ? d.date.includes('2025-12')
            : d.date.includes('2026-01')
        );

      return matchesSearch && matchesDifficulty && matchesSector && matchesMonth;
    });
  }, [searchTerm, selectedDifficulty, selectedSector, selectedMonth]);

  // Difficulty badge colors
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]';
      case 'Moderado':
        return 'bg-[#f9fbe7] text-[#827717] border-[#eaf0b8]';
      case 'Difícil':
        return 'bg-[#fff3e0] text-[#e65100] border-[#ffe0b2]';
      case 'Exigente':
        return 'bg-[#ffebee] text-[#c62828] border-[#ffcdd2]';
      default:
        return 'bg-[#f5f1e7] text-[#13201a] border-[#e2dcd0]';
    }
  };

  const handleSelectDateDirectly = (trail: Trail, dateDisplay: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectTrailById(trail.id, dateDisplay);
    setToastMessage(`Fecha ${dateDisplay} seleccionada para ${trail.name}.`);
    setTimeout(() => {
      navigate('/reservas');
    }, 400);
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    setWaitlistSubmitted(true);
    setToastMessage('¡Te has registrado con éxito a la lista de espera de Chorreras!');
    setTimeout(() => {
      setWaitlistSubmitted(false);
      setWaitlistEmail('');
    }, 4000);
  };

  return (
    <div className="bg-[#f5f1e7] flex flex-col items-start w-full min-h-screen text-[#13201a] bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}



      {/* ── HERO BANNER ── */}
      <section className="bg-[#13201a] text-white px-6 sm:px-12 lg:px-20 py-16 w-full flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-topo-dark opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#dceb6b]/5 to-white/10 animate-mist pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 size-80 bg-[#dceb6b]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-[#9aa8a0]">
          <span onClick={() => navigate('/')} className="hover:text-white cursor-pointer">Inicio</span>
          <span>&gt;</span>
          <span className="text-[#dceb6b]">Senderos</span>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          <p className="font-['Inter:Bold'] font-bold text-xs uppercase tracking-widest text-[#dceb6b] flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            <span>EXPLORA CHINGAZA · CATÁLOGO OFICIAL 2025/2026</span>
          </p>
          <h1 className="font-['Outfit:Black'] font-black text-4xl sm:text-6xl text-white tracking-tight">
            Nuestros 13 Senderos
          </h1>
        </div>

        <p className="relative z-10 text-[#9aa8a0] text-lg sm:text-xl max-w-2xl font-['Inter:Regular'] leading-relaxed">
          Descubre los 13 senderos ecológicos autorizados que atraviesan el páramo, los bosques de niebla y las lagunas sagradas del Parque Nacional Natural Chingaza.
        </p>
      </section>

      {/* ── CONTROLES Y FILTROS INTERACTIVOS CON ESTILO DE MARCA ── */}
      <section className="sticky top-[73px] z-30 w-full px-6 sm:px-12 lg:px-20 py-4 bg-[#f5f1e7]/95 backdrop-blur-md border-b border-[#e5dfd2] shadow-sm">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-[0px_4px_16px_rgba(19,32,26,0.06)] flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between border border-[#e5e0d3]">
          
          {/* Search box input */}
          <div className="flex-1 relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7ea56a]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, sector o palabras clave..."
              className="w-full bg-[#fbf9f4] border border-[#e2dcd0] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#13201a] placeholder:text-[#8e9c94] focus:outline-none focus:border-[#13201a] focus:ring-2 focus:ring-[#dceb6b]/40 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dificultad select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5e6c66] uppercase whitespace-nowrap hidden sm:inline">
              Dificultad:
            </span>
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#fbf9f4] border border-[#e2dcd0] text-[#13201a] text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 outline-none focus:border-[#13201a] cursor-pointer appearance-none transition-all"
              >
                <option value="Todas">Todas las dificultades</option>
                <option value="Fácil">Fácil</option>
                <option value="Moderado">Moderado</option>
                <option value="Difícil">Difícil</option>
                <option value="Exigente">Exigente</option>
              </select>
              <ChevronDown className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
            </div>
          </div>

          {/* Sector select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5e6c66] uppercase whitespace-nowrap hidden sm:inline">
              Sector:
            </span>
            <div className="relative">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-[#fbf9f4] border border-[#e2dcd0] text-[#13201a] text-sm font-semibold rounded-xl px-3.5 py-2.5 pr-8 outline-none focus:border-[#13201a] cursor-pointer appearance-none transition-all"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
            </div>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center gap-1 bg-[#f5f1e7] p-1 rounded-xl border border-[#e2dcd0]">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-white text-[#13201a] shadow-sm' : 'text-[#5e6c66] hover:text-[#13201a]'
              }`}
            >
              <Grid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista de lista detallada"
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                viewMode === 'list' ? 'bg-white text-[#13201a] shadow-sm' : 'text-[#5e6c66] hover:text-[#13201a]'
              }`}
            >
              <List className="size-4" />
            </button>
          </div>

          {/* Result count pill */}
          <div className="bg-[#f5f1e7] px-4 py-2 rounded-full text-xs font-bold text-[#13201a] self-center shrink-0">
            {filteredTrails.length} de {TRAILS_DATA.length} senderos
          </div>

          {/* Reset button if filtered */}
          {(searchTerm || selectedDifficulty !== 'Todas' || selectedSector !== 'Todos' || selectedMonth !== 'Todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDifficulty('Todas');
                setSelectedSector('Todos');
                setSelectedMonth('Todos');
              }}
              title="Restablecer filtros"
              className="p-2 text-[#5e6c66] hover:text-[#13201a] transition-colors rounded-xl bg-[#f0ede4] flex items-center justify-center cursor-pointer shrink-0"
            >
              <RotateCcw className="size-4" />
            </button>
          )}

        </div>
      </section>

      {/* ── MODAL VISTA RÁPIDA DE SENDERO ── */}
      {quickViewTrail && (
        <div 
          onClick={() => setQuickViewTrail(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-[#e5dfd2] relative animate-scale-in flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setQuickViewTrail(null)}
              className="absolute top-5 right-5 size-9 rounded-full bg-[#f5f1e7] hover:bg-[#e8e4da] flex items-center justify-center text-zinc-600 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-4">
              <img
                alt={quickViewTrail.name}
                src={quickViewTrail.image}
                className="size-20 rounded-2xl object-cover shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-xs uppercase font-extrabold text-[#7ea56a]">{quickViewTrail.sector}</span>
                <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a]">{quickViewTrail.name}</h3>
                <span className="text-xs text-[#5e6c64]">Altitud máxima: {quickViewTrail.maxAltitude} · Desnivel: {quickViewTrail.elevationGain}</span>
              </div>
            </div>

            <p className="text-sm text-[#5e6c64] leading-relaxed">
              {quickViewTrail.description}
            </p>

            <div className="bg-[#fbf9f5] p-4 rounded-2xl border border-[#ede8dd] flex flex-col gap-2">
              <span className="text-xs font-bold text-[#13201a] uppercase">Puntos destacados del sendero:</span>
              <ul className="text-xs text-[#5e6c64] space-y-1 list-disc list-inside">
                {quickViewTrail.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#eae5da]">
              <div>
                <span className="text-xs text-[#5e6c64] block">Tarifa por persona:</span>
                <span className="font-extrabold text-xl text-[#13201a]">
                  ${quickViewTrail.pricePerPerson.toLocaleString('es-CO')} COP
                </span>
              </div>

              <button
                onClick={() => {
                  selectTrailById(quickViewTrail.id);
                  navigate(`/senderos/${quickViewTrail.id}`);
                }}
                className="bg-[#13201a] hover:bg-black text-[#dceb6b] font-bold text-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Ver Ficha Técnica Completa</span>
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CATÁLOGO GRID / LIST DE SENDEROS ── */}
      <main className="px-6 sm:px-12 lg:px-20 py-12 w-full max-w-[1600px] mx-auto flex flex-col gap-12">
        
        {filteredTrails.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center gap-4 max-w-lg mx-auto border border-[#e5dfd2]">
            <AlertTriangle className="size-12 text-[#e65100]" />
            <h3 className="text-xl font-bold text-[#13201a]">No encontramos senderos con esos filtros</h3>
            <p className="text-sm text-[#5e6c66]">
              Intenta cambiar la dificultad o limpiar el término de búsqueda para ver más opciones en Chingaza.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDifficulty('Todas');
                setSelectedSector('Todos');
                setSelectedMonth('Todos');
              }}
              className="bg-[#13201a] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-black transition-all cursor-pointer mt-2"
            >
              Ver todos los senderos
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrails.map((trail) => (
              <div
                key={trail.id}
                onClick={() => {
                  selectTrailById(trail.id);
                  navigate(`/senderos/${trail.id}`);
                }}
                className="brand-card group overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div className="relative h-60 w-full overflow-hidden bg-zinc-900">
                  <img
                    alt={trail.name}
                    src={trail.image}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                    {trail.sector.split(' · ')[0]}
                  </div>
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${getDifficultyBadge(trail.difficulty)}`}>
                    {trail.difficulty}
                  </div>

                  {/* Quick preview button on image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewTrail(trail);
                    }}
                    title="Vista previa rápida"
                    className="absolute bottom-3 right-3 bg-white/80 hover:bg-white text-[#13201a] p-2 rounded-xl backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Eye className="size-4" />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-7 flex flex-col gap-4 flex-1 justify-between">
                  <div>
                    <h3 className="font-['Outfit:Bold'] font-bold text-2xl text-[#0f1914] group-hover:text-[#2e7d32] transition-colors">
                      {trail.name}
                    </h3>
                    <p className="text-xs text-[#5e6c66] mt-1.5 line-clamp-2 leading-relaxed">
                      {trail.description}
                    </p>
                  </div>

                  {/* Technical metrics */}
                  <div className="flex items-center gap-5 text-sm text-[#5e6c66] border-y border-[#f2ede4] py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-4 text-[#7ea56a]" />
                      <span className="font-semibold text-xs text-[#0f1914]">{trail.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RouteIcon className="size-4 text-[#7ea56a]" />
                      <span className="font-semibold text-xs text-[#0f1914]">{trail.distance}</span>
                    </div>
                    <div className="ml-auto text-xs font-extrabold text-[#2e7d32] bg-[#e8f5e9] px-2.5 py-1 rounded-lg">
                      ${trail.pricePerPerson.toLocaleString('es-CO')}
                    </div>
                  </div>

                  {/* Cupos interactivos */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-[#5e6c66] flex items-center justify-between">
                      <span>Próximos cupos disponibles:</span>
                      <span className="text-[11px] text-[#7ea56a] font-normal">Click para agendar</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {trail.availableDates.slice(0, 3).map((d) => (
                        <button
                          key={d.date}
                          onClick={(e) => handleSelectDateDirectly(trail, d.display, e)}
                          title={`Click para reservar el ${d.display}`}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all duration-150 cursor-pointer ${
                            d.urgent
                              ? 'bg-[#ffebee] text-[#c62828] hover:bg-[#ffcdd2]'
                              : 'bg-[#f5f1e7] text-[#0f1914] hover:bg-[#dceb6b] hover:text-[#0f1914]'
                          }`}
                        >
                          {d.display.split(' ')[1]} {d.display.split(' ')[2]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="pt-2 flex items-center justify-between border-t border-[#f2ede4]">
                    <span className="font-['Outfit:Bold'] font-bold text-sm text-[#2e7d32] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Ver sendero completo →
                    </span>
                    <span className="text-xs text-[#5e6c66] font-medium">{trail.maxAltitude}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Detailed View */
          <div className="flex flex-col gap-4">
            {filteredTrails.map((trail) => (
              <div
                key={trail.id}
                onClick={() => {
                  selectTrailById(trail.id);
                  navigate(`/senderos/${trail.id}`);
                }}
                className="brand-card p-5 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <img
                    alt={trail.name}
                    src={trail.image}
                    className="size-24 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7ea56a] uppercase">{trail.sector}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getDifficultyBadge(trail.difficulty)}`}>
                        {trail.difficulty}
                      </span>
                    </div>
                    <h3 className="font-['Outfit:Bold'] font-bold text-xl text-[#0f1914]">{trail.name}</h3>
                    <p className="text-xs text-[#5e6c64] line-clamp-1 max-w-lg">{trail.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
                  <div className="flex items-center gap-4 text-xs text-[#5e6c64]">
                    <span>⏱ {trail.duration}</span>
                    <span>📍 {trail.distance}</span>
                    <span className="font-bold text-base text-[#13201a]">
                      ${trail.pricePerPerson.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTrailById(trail.id);
                      navigate('/reservas');
                    }}
                    className="bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-bold text-xs px-5 py-2.5 rounded-full flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Reservar</span>
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DEMOSTRACIÓN DE ESTADO: CAPACIDAD BIOLÓGICA COMPLETADA ── */}
        <div className="mt-8 pt-12 border-t-2 border-[#cfcebf] flex flex-col gap-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="font-['Inter:Bold'] font-bold text-xs uppercase tracking-wider text-[#c62828] flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              Demostración de Estado de Regulación Biológica
            </span>
            <h2 className="font-['Outfit:Bold'] font-bold text-2xl text-[#0f1914]">
              Estado: Sin cupos disponibles (Capacidad de Carga Alcanzada)
            </h2>
            <p className="text-sm text-[#5e6c66] leading-relaxed">
              Para garantizar la regeneración del agua y los frailejones, Parques Nacionales limita la cantidad de caminantes por día. Cuando un sendero agota su capacidad, nuestra plataforma te sugiere fechas alternas o te permite activar alertas automáticas de cupos liberados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-[#e5e0d3] flex flex-col justify-between">
              <div className="relative h-56 w-full overflow-hidden bg-zinc-900">
                <img
                  alt="Sendero Chorreras"
                  src={SOLD_OUT_DEMO_TRAIL.image}
                  className="w-full h-full object-cover filter grayscale contrast-125 opacity-80"
                />
                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs font-bold text-white uppercase">
                  {SOLD_OUT_DEMO_TRAIL.sector}
                </div>
                <div className="absolute top-4 right-4 bg-[#ffebee] text-[#c62828] px-3 py-1 rounded-full text-xs font-bold border border-[#ffcdd2]">
                  Exigente
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <h3 className="font-['Outfit:Bold'] font-bold text-2xl text-[#0f1914]">
                    {SOLD_OUT_DEMO_TRAIL.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-[#c62828] text-xs font-bold">
                    <span className="size-2 rounded-full bg-[#c62828] animate-ping" />
                    <span>Sin cupos para la fecha solicitada</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#5e6c66]">
                    Fechas alternas sugeridas con disponibilidad:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SOLD_OUT_DEMO_TRAIL.suggestedAltDates?.map((altDate) => (
                      <button
                        key={altDate}
                        onClick={() => {
                          selectTrailById('chorreras', `Sábado ${altDate} 2026, 6:00 AM`);
                          navigate('/reservas');
                        }}
                        className="border border-[#5e6c66] hover:bg-[#dceb6b] hover:border-[#dceb6b] hover:text-[#13201a] px-3 py-1 rounded-lg text-xs font-semibold text-[#5e6c66] transition-all cursor-pointer"
                      >
                        {altDate}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waitlist interactive box */}
                <form onSubmit={handleWaitlistSubmit} className="pt-2 border-t border-[#f2ede4] flex flex-col gap-2">
                  <span className="text-xs font-medium text-[#13201a]">
                    ¿Deseas que te avisemos si alguien cancela?
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Tu correo electrónico..."
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="flex-1 bg-[#f5f1e7] border border-[#e2dcd0] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#13201a]"
                    />
                    <button
                      type="submit"
                      className="bg-[#13201a] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-black transition-colors cursor-pointer shrink-0"
                    >
                      Avisarme
                    </button>
                  </div>
                  {waitlistSubmitted && (
                    <span className="text-xs text-[#2e7d32] font-semibold animate-fade-in">
                      ✓ ¡Listo! Te notificaremos de inmediato si se abre un cupo.
                    </span>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER CTA ── */}
      <footer className="w-full bg-[#13201a] text-white py-20 px-6 sm:px-12 lg:px-20 mt-16 flex flex-col items-center text-center gap-8 relative overflow-hidden">
        <div className="flex flex-col gap-3 max-w-2xl relative z-10">
          <p className="font-['Inter:Bold'] font-bold text-xs uppercase tracking-widest text-[#dceb6b]">
            AVENTURA RESPONSABLE
          </p>
          <h2 className="font-['Outfit:Bold'] font-bold text-3xl sm:text-5xl tracking-tight">
            Reserva tu próxima caminata
          </h2>
          <p className="text-[#9aa8a0] text-base sm:text-lg leading-relaxed mt-2 font-['Inter:Regular']">
            El turismo responsable apoya la conservación del páramo y el desarrollo de las familias campesinas de la región. Cupos estrictamente regulados.
          </p>
        </div>

        <button
          onClick={() => {
            selectTrailById('lagunas-de-siecha');
            navigate('/reservas');
          }}
          className="relative z-10 bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#0f1914] font-['Outfit:Bold'] font-bold text-base px-8 py-4 rounded-full flex items-center gap-2 shadow-2xl transition-all cursor-pointer"
        >
          <span>Explorar fechas disponibles</span>
          <ArrowUpRight className="size-5" />
        </button>

        <div className="relative z-10 w-full pt-12 border-t border-[#1e312b] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5e6c66]">
          <div className="flex items-center gap-2 text-white font-bold">
            <Mountain className="size-4 text-[#dceb6b]" />
            <span>NativaTrips</span>
          </div>
          <p>© 2026 NativaTrips Colombia S.A.S. - Operador turístico autorizado de PNN Chingaza.</p>
        </div>
      </footer>

    </div>
  );
};

export default TrailsPage;
