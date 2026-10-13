import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRAILS_DATA, Trail } from '../data/trailsData';
import { Toast } from '../components/Toast';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Mountain, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Phone, 
  Mail, 
  FileText, 
  ArrowLeft, 
  Eye, 
  Calendar,
  Sparkles,
  Sliders,
  Compass,
  HeartPulse,
  Award
} from 'lucide-react';

type AdminTab = 'dashboard' | 'crm' | 'pagos' | 'senderos' | 'guias';
type StaffRole = 'superadmin' | 'operaciones' | 'guia';

interface CRMReservation {
  id: string;
  bookingCode: string;
  leadName: string;
  leadDoc: string;
  leadEmail: string;
  leadPhone: string;
  trailId: string;
  trailName: string;
  trailDate: string;
  memberCount: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: 'Aprobado' | 'Pendiente' | 'Rechazado';
  bookingStatus: 'Confirmada' | 'En Sendero' | 'Completada' | 'Cancelada';
  policyStatus: 'Emitida Colasistencia' | 'Pendiente';
  createdAt: string;
  companions: { name: string; doc: string; bloodType: string; emergencyContact: string }[];
}

interface PaymentTransaction {
  txnId: string;
  bookingCode: string;
  leadName: string;
  method: 'PSE Bancolombia' | 'PSE Davivienda' | 'Tarjeta Visa' | 'Tarjeta Mastercard' | 'Nequi';
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: 'Aprobado' | 'En Proceso' | 'Rechazado';
  timestamp: string;
  authCode: string;
}

interface PNNGuide {
  id: string;
  name: string;
  pnnCard: string;
  phone: string;
  specialty: string;
  languages: string[];
  assignedTrail: string;
  status: 'En Sendero' | 'Disponible' | 'Descanso';
  rating: number;
  expeditionsCount: number;
}

export const AdminCRMPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeRole, setActiveRole] = useState<StaffRole>('superadmin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── CRM RESERVATIONS STATE ──
  const [reservations, setReservations] = useState<CRMReservation[]>(() => {
    const saved = localStorage.getItem('nativa_crm_reservations');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'res-1',
        bookingCode: 'NT-8492',
        leadName: 'Carolina Morales',
        leadDoc: 'CC 1.018.492.301',
        leadEmail: 'carolina.morales@gmail.com',
        leadPhone: '+57 312 458 9012',
        trailId: 'lagunas-de-siecha',
        trailName: 'Sendero Lagunas de Siecha',
        trailDate: 'Sáb 14 Dic 2025, 6:00 AM',
        memberCount: 2,
        totalPrice: 270000,
        paymentMethod: 'PSE Bancolombia',
        paymentStatus: 'Aprobado',
        bookingStatus: 'Confirmada',
        policyStatus: 'Emitida Colasistencia',
        createdAt: '10/12/2025 14:22',
        companions: [
          { name: 'Carolina Morales (Titular)', doc: 'CC 1.018.492.301', bloodType: 'O+', emergencyContact: 'Carlos Morales - 310 998 1234' },
          { name: 'David Alejandro Peña', doc: 'CC 1.020.334.819', bloodType: 'A+', emergencyContact: 'Martha Peña - 314 200 4567' }
        ]
      },
      {
        id: 'res-2',
        bookingCode: 'NT-7104',
        leadName: 'Esteban Valencia',
        leadDoc: 'CC 71.390.844',
        leadEmail: 'esteban.valencia@antioquia.co',
        leadPhone: '+57 301 789 2341',
        trailId: 'sendero-suasie',
        trailName: 'Sendero Suasie',
        trailDate: 'Dom 15 Dic 2025, 6:30 AM',
        memberCount: 4,
        totalPrice: 480000,
        paymentMethod: 'Tarjeta Visa',
        paymentStatus: 'Aprobado',
        bookingStatus: 'En Sendero',
        policyStatus: 'Emitida Colasistencia',
        createdAt: '11/12/2025 09:15',
        companions: [
          { name: 'Esteban Valencia', doc: 'CC 71.390.844', bloodType: 'B+', emergencyContact: 'Lucía Vélez - 300 123 4567' },
          { name: 'Marcela Gómez', doc: 'CC 43.890.123', bloodType: 'O+', emergencyContact: 'Carlos Gómez - 311 234 5678' },
          { name: 'Tomás Valencia Gómez (Menor)', doc: 'TI 1.089.445.123', bloodType: 'O+', emergencyContact: 'Esteban Valencia - 301 789 2341' },
          { name: 'Sofía Valencia Gómez (Menor)', doc: 'TI 1.092.334.887', bloodType: 'O+', emergencyContact: 'Esteban Valencia - 301 789 2341' }
        ]
      },
      {
        id: 'res-3',
        bookingCode: 'NT-9321',
        leadName: 'Felipe Sandoval',
        leadDoc: 'CC 16.789.201',
        leadEmail: 'felipe.sandoval@valledelcauca.org',
        leadPhone: '+57 315 678 9012',
        trailId: 'cuchilla-el-zaque',
        trailName: 'Sendero Cuchilla el Zaque',
        trailDate: 'Sáb 21 Dic 2025, 6:00 AM',
        memberCount: 2,
        totalPrice: 320000,
        paymentMethod: 'PSE Davivienda',
        paymentStatus: 'Aprobado',
        bookingStatus: 'Confirmada',
        policyStatus: 'Emitida Colasistencia',
        createdAt: '12/12/2025 18:40',
        companions: [
          { name: 'Felipe Sandoval', doc: 'CC 16.789.201', bloodType: 'A-', emergencyContact: 'Angela Sandoval - 318 456 7890' },
          { name: 'Camila Rivas', doc: 'CC 1.144.567.890', bloodType: 'O+', emergencyContact: 'Rodrigo Rivas - 317 222 3344' }
        ]
      },
      {
        id: 'res-4',
        bookingCode: 'NT-5502',
        leadName: 'Juan Sebastián Vargas',
        leadDoc: 'CC 1.015.420.918',
        leadEmail: 'juan.vargas@outlook.com',
        leadPhone: '+57 320 890 1234',
        trailId: 'sendero-laguna-seca',
        trailName: 'Sendero Laguna Seca',
        trailDate: 'Dom 22 Dic 2025, 7:00 AM',
        memberCount: 3,
        totalPrice: 330000,
        paymentMethod: 'Nequi',
        paymentStatus: 'Pendiente',
        bookingStatus: 'Cancelada',
        policyStatus: 'Pendiente',
        createdAt: '13/12/2025 11:05',
        companions: [
          { name: 'Juan Sebastián Vargas', doc: 'CC 1.015.420.918', bloodType: 'O+', emergencyContact: 'Clara Vargas - 320 111 2233' }
        ]
      }
    ];
  });

  // ── TRAILS CRUD STATE ──
  const [trailsList, setTrailsList] = useState<Trail[]>(() => {
    const saved = localStorage.getItem('nativa_crm_trails');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return TRAILS_DATA;
  });

  // ── TRANSACTIONS STATE ──
  const [transactions] = useState<PaymentTransaction[]>([
    { txnId: 'TXN-90281-PAYU', bookingCode: 'NT-8492', leadName: 'Carolina Morales', method: 'PSE Bancolombia', grossAmount: 270000, feeAmount: 7830, netAmount: 262170, status: 'Aprobado', timestamp: '10/12/2025 14:22:10', authCode: 'AUTH-892110' },
    { txnId: 'TXN-90282-WOMP', bookingCode: 'NT-7104', leadName: 'Esteban Valencia', method: 'Tarjeta Visa', grossAmount: 480000, feeAmount: 13920, netAmount: 466080, status: 'Aprobado', timestamp: '11/12/2025 09:15:44', authCode: 'AUTH-441092' },
    { txnId: 'TXN-90283-PSE', bookingCode: 'NT-9321', leadName: 'Felipe Sandoval', method: 'PSE Davivienda', grossAmount: 320000, feeAmount: 9280, netAmount: 310720, status: 'Aprobado', timestamp: '12/12/2025 18:40:02', authCode: 'AUTH-773190' },
    { txnId: 'TXN-90284-NEQU', bookingCode: 'NT-5502', leadName: 'Juan Sebastián Vargas', method: 'Nequi', grossAmount: 330000, feeAmount: 9570, netAmount: 320430, status: 'Rechazado', timestamp: '13/12/2025 11:05:19', authCode: 'ERR-TIMEOUT' }
  ]);

  // ── GUIDES STATE ──
  const [guides, setGuides] = useState<PNNGuide[]>([
    { id: 'g-1', name: 'Javier Rodríguez Guasca', pnnCard: 'PNN-GUI-084', phone: '+57 313 420 9182', specialty: 'Flora de Páramo & Aves Andinas', languages: ['Español', 'Inglés'], assignedTrail: 'Lagunas de Siecha', status: 'En Sendero', rating: 4.98, expeditionsCount: 312 },
    { id: 'g-2', name: 'Alba Lucía Quintero', pnnCard: 'PNN-GUI-112', phone: '+57 321 890 3341', specialty: 'Historia Muisca & Geología Glaciar', languages: ['Español', 'Francés'], assignedTrail: 'Sendero Suasie', status: 'En Sendero', rating: 4.95, expeditionsCount: 245 },
    { id: 'g-3', name: 'Fabián Beltrán Choachí', pnnCard: 'PNN-GUI-067', phone: '+57 310 554 1290', specialty: 'Alta Montaña & Primeros Auxilios WFR', languages: ['Español'], assignedTrail: 'Cuchilla el Zaque', status: 'Disponible', rating: 5.0, expeditionsCount: 420 },
    { id: 'g-4', name: 'Yolanda Páramo', pnnCard: 'PNN-GUI-145', phone: '+57 314 776 5432', specialty: 'Mamíferos & Rastreo de Oso Andino', languages: ['Español', 'Inglés'], assignedTrail: 'Plantas de la Sabana', status: 'Descanso', rating: 4.92, expeditionsCount: 180 }
  ]);

  // ── MODAL STATES ──
  const [selectedResForDetail, setSelectedResForDetail] = useState<CRMReservation | null>(null);
  const [isNewTrailModalOpen, setIsNewTrailModalOpen] = useState(false);
  const [editingTrail, setEditingTrail] = useState<Trail | null>(null);

  // ── FILTERS STATE ──
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState<'All' | 'Confirmada' | 'En Sendero' | 'Completada' | 'Cancelada'>('All');

  // Save to localStorage when reservations or trails change
  useEffect(() => {
    localStorage.setItem('nativa_crm_reservations', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('nativa_crm_trails', JSON.stringify(trailsList));
  }, [trailsList]);

  // ── ACTIONS ──
  const handleCheckIn = (resId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, bookingStatus: 'En Sendero' } : r))
    );
    setToastMessage('Check-in exitoso en caseta PNN. Visitantes registrados en terreno.');
  };

  const handleCompleteHike = (resId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, bookingStatus: 'Completada' } : r))
    );
    setToastMessage('Expedición marcada como Completada. Ecoturistas retornaron seguros.');
  };

  const handleToggleTrailStatus = (trailId: string) => {
    setTrailsList((prev) =>
      prev.map((t) => {
        if (t.id === trailId) {
          const currentSlots = t.availableDates[0]?.slots ?? 10;
          const updatedSlots = currentSlots === 0 ? 35 : 0;
          return {
            ...t,
            availableDates: t.availableDates.map((d) => ({
              ...d,
              slots: updatedSlots
            }))
          };
        }
        return t;
      })
    );
    setToastMessage('Capacidad de carga / estado del sendero actualizado.');
  };

  // ── NEW TRAIL FORM STATE ──
  const [newTrailForm, setNewTrailForm] = useState({
    name: '',
    sector: 'Monterredondo',
    difficulty: 'Moderado' as 'Fácil' | 'Moderado' | 'Difícil' | 'Exigente',
    durationHours: 5,
    distanceKm: 7.5,
    minAltitude: 3100,
    maxAltitude: 3650,
    pricePerPerson: 135000,
    dailyCapacity: 35,
    description: ''
  });

  const handleCreateTrail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrailForm.name.trim()) return;

    const id = newTrailForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created: Trail = {
      id,
      name: newTrailForm.name,
      sector: `Sector ${newTrailForm.sector} · PNN Chingaza`,
      difficulty: newTrailForm.difficulty,
      duration: `${newTrailForm.durationHours} Horas`,
      distance: `${newTrailForm.distanceKm} km`,
      elevationGain: `${newTrailForm.maxAltitude - newTrailForm.minAltitude}m`,
      maxAltitude: `${newTrailForm.maxAltitude} m.s.n.m.`,
      pricePerPerson: newTrailForm.pricePerPerson,
      image: '/assets/c31169d755b2287a223f3b4b3e6874b968886199.png',
      description: newTrailForm.description || 'Sendero oficial PNN Chingaza con alta diversidad de páramo y lagunas glaciares.',
      highlights: ['Flora de Alta Montaña', 'Frailejones Milenarios', 'Cuidado del Santuario Hídrico'],
      meetingPoint: `Caseta de Registro Sector ${newTrailForm.sector}, PNN Chingaza`,
      availableDates: [
        { date: '2025-12-28', display: 'Sáb 28 Dic 2025', slots: newTrailForm.dailyCapacity, urgent: false },
        { date: '2025-12-29', display: 'Dom 29 Dic 2025', slots: newTrailForm.dailyCapacity, urgent: false }
      ]
    };

    setTrailsList([created, ...trailsList]);
    setIsNewTrailModalOpen(false);
    setNewTrailForm({
      name: '',
      sector: 'Monterredondo',
      difficulty: 'Moderado',
      durationHours: 5,
      distanceKm: 7.5,
      minAltitude: 3100,
      maxAltitude: 3650,
      pricePerPerson: 135000,
      dailyCapacity: 35,
      description: ''
    });
    setToastMessage(`¡Nuevo sendero "${created.name}" publicado en el catálogo oficial!`);
  };

  // Filtered reservations
  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.bookingCode.toLowerCase().includes(crmSearch.toLowerCase()) ||
      r.leadName.toLowerCase().includes(crmSearch.toLowerCase()) ||
      r.trailName.toLowerCase().includes(crmSearch.toLowerCase()) ||
      r.leadDoc.toLowerCase().includes(crmSearch.toLowerCase());
    const matchesStatus = crmStatusFilter === 'All' || r.bookingStatus === crmStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live stats
  const totalRevenue = transactions.filter(t => t.status === 'Aprobado').reduce((acc, t) => acc + t.grossAmount, 0);
  const totalNet = transactions.filter(t => t.status === 'Aprobado').reduce((acc, t) => acc + t.netAmount, 0);
  const totalEcotourists = reservations.reduce((acc, r) => acc + r.memberCount, 0);
  const activeHikesCount = reservations.filter(r => r.bookingStatus === 'En Sendero').length;

  return (
    <div className="min-h-screen bg-[#0e1713] text-white flex flex-col font-['Inter:Regular']">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ── TOP NAVIGATION BAR (ADMIN & STAFF PORTAL) ── */}
      <header className="bg-[#13201a] border-b border-[#22392f] px-6 py-4 sticky top-0 z-50 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              title="Volver a la vista pública de NativaTrips"
            >
              <div className="size-9 rounded-xl bg-[#dceb6b] text-[#13201a] flex items-center justify-center font-black">
                <Mountain className="size-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-['Outfit:Bold'] font-black tracking-tight text-lg text-white leading-none">
                  NativaTrips <span className="text-[#dceb6b]">CRM</span>
                </span>
                <span className="text-[10px] text-[#7ea56a] font-bold uppercase tracking-wider">
                  Consola Administrativa & Guías PNN
                </span>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1.5 bg-[#0c2b25] px-3 py-1 rounded-full border border-[#dceb6b]/30 text-xs text-[#dceb6b]">
              <Lock className="size-3 text-[#dceb6b]" />
              <span className="font-mono text-[11px] font-bold">Portal Seguro PNN #4812</span>
            </div>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0c1a15] p-1 rounded-xl border border-white/10 text-xs">
              <span className="px-2.5 py-1 text-white/50 text-[11px] font-bold hidden sm:inline">Rol:</span>
              <button
                onClick={() => setActiveRole('superadmin')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRole === 'superadmin' ? 'bg-[#dceb6b] text-[#13201a]' : 'text-white/70 hover:text-white'
                }`}
              >
                Director PNN
              </button>
              <button
                onClick={() => setActiveRole('operaciones')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRole === 'operaciones' ? 'bg-[#dceb6b] text-[#13201a]' : 'text-white/70 hover:text-white'
                }`}
              >
                Administrativo
              </button>
              <button
                onClick={() => setActiveRole('guia')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRole === 'guia' ? 'bg-[#dceb6b] text-[#13201a]' : 'text-white/70 hover:text-white'
                }`}
              >
                Guía en Campo
              </button>
            </div>

            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
              title="Cerrar y volver a la web"
            >
              <ArrowLeft className="size-4" />
            </button>
          </div>

        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-3 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 font-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="size-4" />
            <span>Dashboard & Stats en Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'crm'
                ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 font-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="size-4" />
            <span>CRM Ecoturistas & Reservas</span>
            <span className="bg-[#13201a] text-[#dceb6b] px-1.5 py-0.5 rounded-full text-[10px] font-mono">
              {reservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pagos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'pagos'
                ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 font-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <CreditCard className="size-4" />
            <span>Gestión de Pagos & Conciliación</span>
          </button>

          <button
            onClick={() => setActiveTab('senderos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'senderos'
                ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 font-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Mountain className="size-4" />
            <span>Gestión & Creación de Senderos</span>
            <span className="bg-[#13201a] text-[#dceb6b] px-1.5 py-0.5 rounded-full text-[10px] font-mono">
              {trailsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guias')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'guias'
                ? 'bg-[#dceb6b] text-[#13201a] shadow-lg shadow-[#dceb6b]/20 font-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <UserCheck className="size-4" />
            <span>Cuadrilla de Guías PNN</span>
            <span className="bg-[#13201a] text-[#dceb6b] px-1.5 py-0.5 rounded-full text-[10px] font-mono">
              {guides.length}
            </span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-7xl mx-auto w-full p-6 sm:p-8 flex-1 flex flex-col gap-8">

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: DASHBOARD & LIVE STATS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] shadow-lg flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Facturación Mes
                  </span>
                  <div className="p-2 rounded-xl bg-[#dceb6b]/15 text-[#dceb6b]">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black font-['Outfit:Bold'] text-white">
                    ${totalRevenue.toLocaleString('es-CO')}
                  </span>
                  <span className="text-xs text-[#dceb6b] block font-bold mt-1">
                    +18.4% vs mes anterior
                  </span>
                </div>
                <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 flex justify-between">
                  <span>Neto recaudado:</span>
                  <span className="font-mono text-white/90">${totalNet.toLocaleString('es-CO')} COP</span>
                </div>
              </div>

              <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] shadow-lg flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Ecoturistas en Parque
                  </span>
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                    <Users className="size-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black font-['Outfit:Bold'] text-white">
                    {totalEcotourists} <span className="text-base font-normal text-white/60">visitantes</span>
                  </span>
                  <span className="text-xs text-sky-400 block font-bold mt-1">
                    {activeHikesCount} grupos activos hoy en sendero
                  </span>
                </div>
                <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 flex justify-between">
                  <span>Pólizas Colasistencia:</span>
                  <span className="text-emerald-400 font-bold">100% Cobertura</span>
                </div>
              </div>

              <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] shadow-lg flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Capacidad Regulada PNN
                  </span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <ShieldCheck className="size-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black font-['Outfit:Bold'] text-white">
                    42% <span className="text-base font-normal text-white/60">ocupación</span>
                  </span>
                  <span className="text-xs text-amber-400 block font-bold mt-1">
                    Carga ecológica sustentable
                  </span>
                </div>
                <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 flex justify-between">
                  <span>Cupo diario máximo:</span>
                  <span className="font-mono text-white/90">120 ecoturistas/día</span>
                </div>
              </div>

              <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] shadow-lg flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                    Satisfacción Google Maps
                  </span>
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                    <Award className="size-5" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black font-['Outfit:Bold'] text-white">
                    4.9 <span className="text-amber-400 text-2xl">★★★★★</span>
                  </span>
                  <span className="text-xs text-white/80 block font-bold mt-1">
                    148 opiniones verificadas
                  </span>
                </div>
                <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 flex justify-between">
                  <span>Tasa de recomendación:</span>
                  <span className="text-[#dceb6b] font-bold">99.2%</span>
                </div>
              </div>

            </div>

            {/* Trail Capacity Bar Gauges */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-8 bg-[#13201a] p-6 sm:p-8 rounded-3xl border border-[#233c32] shadow-lg flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-['Outfit:Bold'] text-xl font-bold text-white">
                      Ocupación y Aforo de Senderos en Tiempo Real
                    </h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      Monitoreo de capacidad de carga exigida por Parques Nacionales Naturales de Colombia.
                    </p>
                  </div>
                  <span className="text-xs bg-[#0c2b25] px-3 py-1 rounded-full text-[#dceb6b] border border-[#dceb6b]/30 font-bold">
                    Hoy: 14 Dic
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { name: 'Sendero Lagunas de Siecha', current: 28, max: 40, sector: 'Siecha', status: 'Alta demanda' },
                    { name: 'Sendero Suasie', current: 14, max: 35, sector: 'Monterredondo', status: 'Normal' },
                    { name: 'Sendero Cuchilla el Zaque', current: 8, max: 20, sector: 'Piedras Gordas', status: 'Cupos disponibles' },
                    { name: 'Sendero Laguna Seca', current: 6, max: 25, sector: 'Monterredondo', status: 'Cupos disponibles' }
                  ].map((tr, idx) => {
                    const pct = Math.round((tr.current / tr.max) * 100);
                    return (
                      <div key={idx} className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white text-sm">{tr.name}</span>
                          <span className="font-mono text-white/80">
                            {tr.current} / {tr.max} cupos ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct > 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-[#10b981] to-[#dceb6b]'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-white/50">
                          <span>Sector: {tr.sector}</span>
                          <span className="text-[#dceb6b] font-semibold">{tr.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Activities Stream */}
              <div className="lg:col-span-4 bg-[#13201a] p-6 sm:p-8 rounded-3xl border border-[#233c32] shadow-lg flex flex-col gap-4">
                <h3 className="font-['Outfit:Bold'] text-lg font-bold text-white flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#dceb6b] animate-pulse" />
                  Actividad Operativa en Vivo
                </h3>

                <div className="flex flex-col divide-y divide-white/10 text-xs">
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-[#dceb6b]">Hace 8 min · Pago PSE</span>
                    <p className="text-white/90">Pago aprobado por $270.000 COP para Carolina Morales (NT-8492).</p>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-sky-400">Hace 25 min · Caseta Siecha</span>
                    <p className="text-white/90">Guía Javier Rodríguez reportó inicio de ascenso con 2 visitantes.</p>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-amber-400">Hace 1 hora · Clima PNN</span>
                    <p className="text-white/90">Niebla densa en Cuchilla el Zaque. Visibilidad reducida a 15 metros.</p>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-emerald-400">Hace 2 horas · Fauna</span>
                    <p className="text-white/90">Avistamiento de venado cola blanca hembra con cría cerca a Monterredondo.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: CRM & GESTIÓN DE ECOTURISTAS Y RESERVAS
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'crm' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Header and Search/Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#13201a] p-6 rounded-3xl border border-[#233c32]">
              <div>
                <h2 className="font-['Outfit:Bold'] text-2xl font-black text-white">
                  Expedientes & Gestión de Reservas
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Consulta de titulares, acompañantes, pólizas médicas y control de acceso en terreno.
                </p>
              </div>

              {/* Search input & status pills */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="size-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Buscar código, titular, cédula..."
                    className="w-full bg-[#0c1a15] text-xs text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-[#dceb6b]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#0c1a15] p-1 rounded-xl border border-white/10 text-xs">
                  {(['All', 'Confirmada', 'En Sendero', 'Completada', 'Cancelada'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setCrmStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        crmStatusFilter === st
                          ? 'bg-[#dceb6b] text-[#13201a]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {st === 'All' ? 'Todos' : st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="bg-[#13201a] rounded-3xl border border-[#233c32] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c1a15] text-white/50 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">Código / Fecha</th>
                      <th className="py-4 px-6">Titular & Contacto</th>
                      <th className="py-4 px-6">Sendero Asignado</th>
                      <th className="py-4 px-6">Grupo</th>
                      <th className="py-4 px-6">Total COP</th>
                      <th className="py-4 px-6">Póliza Médica</th>
                      <th className="py-4 px-6">Estado</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredReservations.map((res) => (
                      <tr key={res.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-black text-[#dceb6b] text-sm block">
                            {res.bookingCode}
                          </span>
                          <span className="text-[11px] text-white/50">{res.trailDate}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-white block">{res.leadName}</span>
                          <span className="text-[11px] text-white/60 block">{res.leadDoc}</span>
                          <span className="text-[10px] text-white/40">{res.leadPhone}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-white/90 block">{res.trailName}</span>
                          <span className="text-[10px] text-emerald-400">Guía asignado</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                            {res.memberCount} pers
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-white">
                            ${res.totalPrice.toLocaleString('es-CO')}
                          </span>
                          <span className="text-[10px] text-white/50 block">{res.paymentMethod}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            res.policyStatus.includes('Emitida') ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <ShieldCheck className="size-3.5" />
                            {res.policyStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
                            res.bookingStatus === 'Confirmada'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : res.bookingStatus === 'En Sendero'
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse'
                              : res.bookingStatus === 'Completada'
                              ? 'bg-white/10 text-white/70'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {res.bookingStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedResForDetail(res)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                              title="Ver ficha completa de acompañantes y datos de salud"
                            >
                              <Eye className="size-4" />
                            </button>

                            {res.bookingStatus === 'Confirmada' && (
                              <button
                                onClick={() => handleCheckIn(res.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#dceb6b] hover:bg-[#cde055] text-[#13201a] font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                                title="Check-in de ingreso en caseta PNN"
                              >
                                <CheckCircle2 className="size-3.5" />
                                <span>Check-in</span>
                              </button>
                            )}

                            {res.bookingStatus === 'En Sendero' && (
                              <button
                                onClick={() => handleCompleteHike(res.id)}
                                className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                                title="Cerrar expedición al finalizar sendero"
                              >
                                <span>Retorno OK</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: GESTIÓN DE PAGOS & CONCILIACIÓN
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pagos' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-['Outfit:Bold'] text-2xl font-black text-white">
                  Transacciones & Pasarelas de Pago
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Conciliación de pagos en línea vía PayU, PSE, tarjetas bancarias colombianas y Nequi.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setToastMessage('Descargando reporte financiero consolidado en formato CSV...')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>Exportar Reporte Contable</span>
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#13201a] rounded-3xl border border-[#233c32] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0c1a15] text-white/50 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">ID Transacción</th>
                      <th className="py-4 px-6">Reserva / Titular</th>
                      <th className="py-4 px-6">Método de Pago</th>
                      <th className="py-4 px-6">Monto Bruto</th>
                      <th className="py-4 px-6">Comisión</th>
                      <th className="py-4 px-6">Neto PNN</th>
                      <th className="py-4 px-6">Fecha & Hora</th>
                      <th className="py-4 px-6">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {transactions.map((txn) => (
                      <tr key={txn.txnId} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-[#dceb6b] block">{txn.txnId}</span>
                          <span className="text-[10px] text-white/40">{txn.authCode}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-white block">{txn.bookingCode}</span>
                          <span className="text-white/70 text-[11px]">{txn.leadName}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-white/90">{txn.method}</span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-white">
                          ${txn.grossAmount.toLocaleString('es-CO')}
                        </td>
                        <td className="py-4 px-6 font-mono text-rose-400">
                          -${txn.feeAmount.toLocaleString('es-CO')}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                          ${txn.netAmount.toLocaleString('es-CO')}
                        </td>
                        <td className="py-4 px-6 text-white/60 font-mono text-[11px]">
                          {txn.timestamp}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            txn.status === 'Aprobado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: GESTIÓN & CREACIÓN/AJUSTE DE SENDEROS (CRUD)
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'senderos' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#13201a] p-6 rounded-3xl border border-[#233c32]">
              <div>
                <h2 className="font-['Outfit:Bold'] text-2xl font-black text-white">
                  Catálogo Oficial de Senderos PNN
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Regula aforos diarios, ajusta tarifas por persona y publica nuevos senderos ecológicos.
                </p>
              </div>

              <button
                onClick={() => setIsNewTrailModalOpen(true)}
                className="px-5 py-3 rounded-full bg-[#dceb6b] hover:bg-[#cde055] text-[#13201a] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#dceb6b]/20 transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Crear Nuevo Sendero</span>
              </button>
            </div>

            {/* Trails Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trailsList.map((tr) => {
                const currentSlots = tr.availableDates[0]?.slots ?? 20;
                const isAvailable = currentSlots > 0;
                return (
                  <div
                    key={tr.id}
                    className="bg-[#13201a] rounded-3xl border border-[#233c32] p-6 flex flex-col justify-between gap-5 shadow-lg hover:border-[#dceb6b]/40 transition-all relative group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#dceb6b] uppercase tracking-wider bg-[#0c2b25] px-2.5 py-1 rounded-full border border-[#dceb6b]/30">
                          {tr.sector}
                        </span>
                        
                        {/* Status Toggle Badge */}
                        <button
                          onClick={() => handleToggleTrailStatus(tr.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                          title="Clic para cambiar estado abierto / cerrado"
                        >
                          <span className={`size-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{isAvailable ? 'Habilitado' : 'Cerrado PNN'}</span>
                        </button>
                      </div>

                      <h3 className="font-['Outfit:Bold'] text-lg font-bold text-white group-hover:text-[#dceb6b] transition-colors">
                        {tr.name}
                      </h3>

                      <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                        {tr.description}
                      </p>
                    </div>

                    {/* Trail Specs Matrix */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0c1a15] p-3 rounded-2xl border border-white/5 text-[11px] text-center">
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase">Dificultad</span>
                        <span className="font-bold text-white">{tr.difficulty}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase">Duración</span>
                        <span className="font-bold text-white">{tr.duration}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase">Cupo Hoy</span>
                        <span className="font-bold text-[#dceb6b]">{currentSlots} pers</span>
                      </div>
                    </div>

                    {/* Price and Action Footer */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-white/50 block">Tarifa Oficial:</span>
                        <span className="font-mono font-bold text-white text-base">
                          ${tr.pricePerPerson.toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingTrail(tr)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                          title="Ajustar tarifas y aforos de este sendero"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/senderos/${tr.id}`)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#dceb6b] transition-all cursor-pointer"
                          title="Ver cómo lo ve el visitante"
                        >
                          <ExternalLink className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 5: CUADRILLA DE GUÍAS PNN
           ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'guias' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            <div className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-['Outfit:Bold'] text-2xl font-black text-white">
                  Cuadrilla de Guías Nativos Certificados
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Carnets oficiales PNN, asignaciones de sendero y registro de expediciones realizadas.
                </p>
              </div>

              <span className="bg-[#0c2b25] px-4 py-2 rounded-full border border-[#dceb6b]/30 text-xs font-bold text-[#dceb6b]">
                {guides.filter(g => g.status === 'En Sendero').length} Guías en Terreno Ahora
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-[#13201a] p-6 rounded-3xl border border-[#233c32] shadow-lg flex flex-col justify-between gap-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="size-14 rounded-2xl bg-gradient-to-br from-[#1b3d32] to-[#0c241c] border border-[#dceb6b]/30 flex items-center justify-center text-xl font-black text-[#dceb6b]">
                        {guide.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-['Outfit:Bold'] font-bold text-lg text-white">
                          {guide.name}
                        </span>
                        <span className="font-mono text-xs text-[#7ea56a] font-bold">
                          Carnet: {guide.pnnCard}
                        </span>
                        <span className="text-[11px] text-white/60 mt-0.5">
                          {guide.specialty}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      guide.status === 'En Sendero'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : guide.status === 'Disponible'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/10 text-white/50'
                    }`}>
                      {guide.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#0c1a15] p-3 rounded-2xl border border-white/5 text-[11px] text-center">
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Sendero Hoy</span>
                      <span className="font-bold text-white">{guide.assignedTrail}</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Calificación</span>
                      <span className="font-bold text-amber-400">{guide.rating} ★</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-[9px] uppercase">Expediciones</span>
                      <span className="font-mono font-bold text-[#dceb6b]">{guide.expeditionsCount}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-[#dceb6b]" />
                      {guide.phone}
                    </span>
                    <span className="text-[11px] font-semibold text-white/80">
                      Idiomas: {guide.languages.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* ── MODAL: CRM EXPEDIENTE COMPLETO DEL ECOTURISTA ── */}
      {selectedResForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13201a] border border-[#233c32] rounded-3xl max-w-2xl w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-[#dceb6b] tracking-wider">
                  Ficha Oficial del Ecoturista PNN
                </span>
                <h3 className="font-['Outfit:Bold'] text-2xl font-bold text-white mt-1">
                  Reserva {selectedResForDetail.bookingCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResForDetail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#0c1a15] p-4 rounded-2xl border border-white/5 text-xs">
              <div>
                <span className="text-white/40 block text-[10px]">Titular:</span>
                <span className="font-bold text-white">{selectedResForDetail.leadName}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Documento:</span>
                <span className="font-mono text-white/90">{selectedResForDetail.leadDoc}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Teléfono:</span>
                <span className="text-white/90">{selectedResForDetail.leadPhone}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Sendero:</span>
                <span className="font-bold text-[#dceb6b]">{selectedResForDetail.trailName}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Fecha:</span>
                <span className="text-white/90">{selectedResForDetail.trailDate}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[10px]">Total Pagado:</span>
                <span className="font-mono font-bold text-emerald-400">${selectedResForDetail.totalPrice.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Companions Dossier with Blood Type & Emergency Contact */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#dceb6b] flex items-center gap-1.5">
                <HeartPulse className="size-4" />
                Nómina de Visitantes y Contactos de Emergencia
              </span>

              <div className="flex flex-col gap-2">
                {selectedResForDetail.companions.map((comp, idx) => (
                  <div key={idx} className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                    <div>
                      <span className="font-bold text-white text-sm block">{comp.name}</span>
                      <span className="text-white/50 font-mono text-[11px]">{comp.doc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
                        RH: {comp.bloodType}
                      </span>
                      <span className="text-[11px] text-white/70">
                        Emergencia: <strong className="text-white">{comp.emergencyContact}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions in Modal */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setToastMessage(`Recordatorio y credencial reenviada por WhatsApp a ${selectedResForDetail.leadPhone}`);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="size-3.5 text-[#dceb6b]" />
                <span>Reenviar WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedResForDetail(null)}
                className="px-5 py-2 rounded-xl bg-[#dceb6b] text-[#13201a] font-bold text-xs transition-all cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO SENDERO ── */}
      {isNewTrailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTrail}
            className="bg-[#13201a] border border-[#233c32] rounded-3xl max-w-xl w-full p-6 sm:p-8 flex flex-col gap-5 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#dceb6b] tracking-wider">
                  Módulo de Parques Nacionales
                </span>
                <h3 className="font-['Outfit:Bold'] text-2xl font-bold text-white mt-0.5">
                  Crear y Publicar Nuevo Sendero
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTrailModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Nombre del Sendero</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sendero Cueva de los Murciélagos"
                  value={newTrailForm.name}
                  onChange={(e) => setNewTrailForm({ ...newTrailForm, name: e.target.value })}
                  className="bg-[#0c1a15] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#dceb6b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 font-bold uppercase text-[10px]">Sector PNN</label>
                  <select
                    value={newTrailForm.sector}
                    onChange={(e) => setNewTrailForm({ ...newTrailForm, sector: e.target.value })}
                    className="bg-[#0c1a15] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#dceb6b]"
                  >
                    <option value="Monterredondo">Monterredondo</option>
                    <option value="Siecha">Siecha</option>
                    <option value="Piedras Gordas">Piedras Gordas</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 font-bold uppercase text-[10px]">Dificultad</label>
                  <select
                    value={newTrailForm.difficulty}
                    onChange={(e) => setNewTrailForm({ ...newTrailForm, difficulty: e.target.value as any })}
                    className="bg-[#0c1a15] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#dceb6b]"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Extrema">Extrema</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 font-bold uppercase text-[10px]">Cupo Diario</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newTrailForm.dailyCapacity}
                    onChange={(e) => setNewTrailForm({ ...newTrailForm, dailyCapacity: Number(e.target.value) })}
                    className="bg-[#0c1a15] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#dceb6b]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 font-bold uppercase text-[10px]">Tarifa COP / Pers</label>
                  <input
                    type="number"
                    step="5000"
                    value={newTrailForm.pricePerPerson}
                    onChange={(e) => setNewTrailForm({ ...newTrailForm, pricePerPerson: Number(e.target.value) })}
                    className="bg-[#0c1a15] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#dceb6b]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 font-bold uppercase text-[10px]">Duración (Horas)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newTrailForm.durationHours}
                    onChange={(e) => setNewTrailForm({ ...newTrailForm, durationHours: Number(e.target.value) })}
                    className="bg-[#0c1a15] border border-white/10 rounded-xl px-3 py-3 text-white outline-none focus:border-[#dceb6b]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Descripción Ecológica & Atractivos</label>
                <textarea
                  rows={3}
                  placeholder="Describe la ruta, lagunas, especies de flora y recomendaciones..."
                  value={newTrailForm.description}
                  onChange={(e) => setNewTrailForm({ ...newTrailForm, description: e.target.value })}
                  className="bg-[#0c1a15] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#dceb6b]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsNewTrailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#dceb6b] hover:bg-[#cde055] text-[#13201a] font-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>Publicar Sendero</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: EDITAR / AJUSTAR SENDERO EXISTENTE ── */}
      {editingTrail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13201a] border border-[#233c32] rounded-3xl max-w-lg w-full p-6 sm:p-8 flex flex-col gap-5 shadow-2xl animate-scale-in">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#dceb6b] tracking-wider">
                  Ajuste de Capacidad & Tarifas
                </span>
                <h3 className="font-['Outfit:Bold'] text-xl font-bold text-white mt-0.5">
                  {editingTrail.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingTrail(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Cupo Máximo Diario (PNN)</label>
                <input
                  type="number"
                  defaultValue={editingTrail.availableDates[0]?.slots ?? 25}
                  id="editTrailCapacity"
                  className="bg-[#0c1a15] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#dceb6b]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Tarifa Oficial por Persona ($ COP)</label>
                <input
                  type="number"
                  step="5000"
                  defaultValue={editingTrail.pricePerPerson}
                  id="editTrailPrice"
                  className="bg-[#0c1a15] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#dceb6b]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingTrail(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const capInput = document.getElementById('editTrailCapacity') as HTMLInputElement;
                  const priceInput = document.getElementById('editTrailPrice') as HTMLInputElement;
                  const currentSlots = editingTrail.availableDates[0]?.slots ?? 25;
                  const newCap = capInput ? Number(capInput.value) : currentSlots;
                  const newPrice = priceInput ? Number(priceInput.value) : editingTrail.pricePerPerson;

                  setTrailsList(prev => prev.map(t => t.id === editingTrail.id ? { 
                    ...t, 
                    pricePerPerson: newPrice,
                    availableDates: t.availableDates.map(d => ({ ...d, slots: newCap }))
                  } : t));
                  setEditingTrail(null);
                  setToastMessage(`Ajustes guardados para "${editingTrail.name}". Nuevos cupos: ${newCap}, Tarifa: $${newPrice.toLocaleString('es-CO')}.`);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#dceb6b] hover:bg-[#cde055] text-[#13201a] font-black text-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCRMPage;
