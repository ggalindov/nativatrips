import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import { Toast } from '../components/Toast';
import {
  Mountain,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Mail,
  ArrowUpRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  Share2,
  Printer,
  Sparkles,
  ExternalLink,
  QrCode,
  PhoneCall,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';

export const BookingConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { state: bookingState, calculateCosts } = useBooking();
  const { user } = useAuth();
  const costs = calculateCosts();

  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#dceb6b', '#13201a', '#7ea56a', '#ffffff', '#e8d9b5']
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingState.bookingCode);
    setCopied(true);
    setToastMessage(`¡Código ${bookingState.bookingCode} copiado al portapapeles!`);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setToastMessage(`Voucher enviado exitosamente a ${bookingState.leadVisitor.email}`);
    setTimeout(() => setEmailSent(false), 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌿 ¡Hola! Ya tengo confirmada nuestra expedición a Chingaza con NativaTrips.\n\n` +
      `🏔️ Sendero: ${bookingState.trailName}\n` +
      `📅 Fecha: ${bookingState.trailDate}\n` +
      `⏰ Hora: 6:00 AM puntual\n` +
      `📍 Encuentro: ${bookingState.meetingPoint}\n` +
      `🎫 Código de reserva: ${bookingState.bookingCode}\n\n` +
      `Por favor revisen las recomendaciones de morral y ropa aquí: ${window.location.origin}/pre-tour`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleAddToGoogleCalendar = () => {
    // Generate Google Calendar Link
    const title = encodeURIComponent(`NativaTrips: ${bookingState.trailName} (PNN Chingaza)`);
    const details = encodeURIComponent(
      `Expedición oficial a ${bookingState.trailName} en PNN Chingaza.\n` +
      `Código de Reserva: ${bookingState.bookingCode}\n` +
      `Punto de encuentro: ${bookingState.meetingPoint}\n` +
      `Grupo: ${bookingState.memberCount} persona(s)\n` +
      `Titular: ${bookingState.leadVisitor.fullName}\n` +
      `Recomendaciones: ${window.location.origin}/pre-tour`
    );
    const location = encodeURIComponent(`${bookingState.meetingPoint}, PNN Chingaza, Colombia`);
    
    // Fallback date format YYYYMMDDTHHMMSSZ
    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(calUrl, '_blank');
  };

  return (
    <div className="bg-[#f5f1e7] flex flex-col items-center w-full min-h-screen text-[#13201a] bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}



      {/* ── HERO DE CELEBRACIÓN ── */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 flex flex-col items-center gap-8 animate-fade-in">
        
        {/* Success Header Box */}
        <div className="flex flex-col items-center text-center gap-3 no-print">
          <div className="relative">
            <div className="bg-[#dceb6b] size-20 rounded-full flex items-center justify-center shadow-xl animate-scale-in border-4 border-white">
              <CheckCircle2 className="size-11 text-[#13201a]" />
            </div>
            <div className="absolute -top-1 -right-1 bg-[#13201a] text-[#dceb6b] p-1.5 rounded-full shadow">
              <Sparkles className="size-3.5" />
            </div>
          </div>

          <span className="text-xs font-extrabold uppercase tracking-widest text-[#7ea56a] mt-1">
            Reserva Registrada Exitosamente
          </span>

          <h1 className="font-['Outfit:Black'] font-black text-3xl sm:text-5xl text-[#13201a] tracking-tight">
            ¡Nos vemos en el páramo!
          </h1>
          <p className="text-sm sm:text-base text-[#55665c] max-w-lg leading-relaxed">
            Tu ingreso al Parque Nacional Natural Chingaza ha sido validado ante las autoridades ambientales. Hemos enviado una copia íntegra a <strong className="text-[#13201a]">{bookingState.leadVisitor.email}</strong>.
          </p>
        </div>

        {/* Expedition Live Countdown Badge */}
        <div className="bg-[#13201a] text-white px-6 py-4 rounded-2xl border border-[#2e4036] shadow-md flex items-center justify-between gap-6 flex-wrap w-full max-w-xl no-print animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="bg-[#dceb6b] text-[#13201a] size-10 rounded-xl flex items-center justify-center font-bold shrink-0">
              <Compass className="size-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#dceb6b] tracking-wider block">
                Cuenta Regresiva a la Expedición
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                Faltan 7 días para tu ascenso en {bookingState.trailName.replace('Sendero ', '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-center mx-auto sm:mx-0">
            <div className="bg-white/10 px-2.5 py-1 rounded-lg min-w-10">
              <span className="font-mono font-black text-sm text-[#dceb6b]">07</span>
              <span className="text-[8px] uppercase block text-white/60">Días</span>
            </div>
            <span className="font-bold text-white/40">:</span>
            <div className="bg-white/10 px-2.5 py-1 rounded-lg min-w-10">
              <span className="font-mono font-black text-sm text-[#dceb6b]">14</span>
              <span className="text-[8px] uppercase block text-white/60">Hrs</span>
            </div>
            <span className="font-bold text-white/40">:</span>
            <div className="bg-white/10 px-2.5 py-1 rounded-lg min-w-10">
              <span className="font-mono font-black text-sm text-[#dceb6b]">22</span>
              <span className="text-[8px] uppercase block text-white/60">Min</span>
            </div>
          </div>
        </div>

        {/* ── ANDEAN BOARDING PASS VOUCHER (TARJETA TIPO PASE DE ABORDAJE PNN) ── */}
        <div className="w-full bg-white rounded-3xl border-2 border-[#13201a] shadow-[0px_16px_40px_rgba(19,32,26,0.12)] overflow-hidden">
          
          {/* Header del Ticket */}
          <div className="bg-[#13201a] text-white p-6 sm:px-8 sm:py-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#2e4036]">
            <div className="flex items-center gap-3">
              <div className="bg-[#dceb6b] size-10 rounded-xl flex items-center justify-center text-[#13201a]">
                <Mountain className="size-6" />
              </div>
              <div>
                <span className="font-['Outfit:Black'] font-black text-lg tracking-tight text-white block">
                  PASE OFICIAL DE EXPEDICIÓN
                </span>
                <span className="text-[11px] text-[#dceb6b] uppercase tracking-wider font-bold">
                  Parque Nacional Natural Chingaza · Operador #4812
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#243d34] border border-[#3b5e51] px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#dceb6b] animate-ping" />
                <span className="text-xs font-black tracking-widest text-[#dceb6b] uppercase">
                  PÓLIZA ACTIVA
                </span>
              </div>
            </div>
          </div>

          {/* Cuerpo del Voucher (Grid responsivo: Información central + Talón de control) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[#d4cdbf]">
            
            {/* Sección Principal (8 columnas) */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6">
              
              {/* Sendero y foto */}
              <div className="flex items-start gap-4">
                <img
                  alt={bookingState.trailName}
                  src={bookingState.trailImage}
                  className="size-20 sm:size-24 rounded-2xl object-cover border border-[#e2dcd0] shrink-0 shadow-sm"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#f5f1e7] text-[#13201a] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-[#e2dcd0]">
                      {bookingState.trailSector}
                    </span>
                    <span className="text-xs font-bold text-[#7ea56a]">
                      Dificultad: {bookingState.difficulty}
                    </span>
                  </div>
                  <h2 className="font-['Outfit:Black'] font-black text-xl sm:text-2xl text-[#13201a] leading-tight">
                    {bookingState.trailName}
                  </h2>
                  <p className="text-xs text-[#5e6c64]">
                    Altitud máxima: 3.550m s.n.m. · Ecosistema de alta montaña y subpáramo
                  </p>
                </div>
              </div>

              {/* Grid de detalles técnicos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#faf8f3] p-5 rounded-2xl border border-[#ece7dc]">
                <div>
                  <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider block">
                    Fecha de Ingreso
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#13201a]">
                    {bookingState.trailDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider block">
                    Hora Presentación
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#13201a]">
                    06:00 AM (Puntual)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider block">
                    Cupos Reservados
                  </span>
                  <span className="text-sm sm:text-base font-black text-[#13201a]">
                    {bookingState.memberCount} persona(s)
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider block">
                    Titular Responsable
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#13201a]">
                    {bookingState.leadVisitor.fullName} · C.C. {bookingState.leadVisitor.docNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider block">
                    Teléfono Contacto
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#13201a]">
                    {bookingState.leadVisitor.phone}
                  </span>
                </div>
              </div>

              {/* Punto de encuentro */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-[#e2dcd0]">
                <MapPin className="size-5 text-[#13201a] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#13201a]">Punto de Encuentro Oficial:</span>
                  <span className="text-xs text-[#5e6c64] font-medium leading-relaxed">
                    {bookingState.meetingPoint}. Te esperará el guía con uniforme oficial verde de NativaTrips y chaleco reflectivo.
                  </span>
                </div>
              </div>

              {/* Resumen de Pago */}
              <div className="border-t border-[#eae5da] pt-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] uppercase font-bold text-[#55665c] block">
                    Anticipo Pagado con Pasarela
                  </span>
                  <span className="font-['Outfit:Black'] font-black text-2xl text-[#13201a]">
                    ${costs.depositRequired.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase font-bold text-[#55665c] block">
                    Saldo Restante en Sitio (al Guía)
                  </span>
                  <span className="font-['Outfit:Bold'] font-bold text-lg text-[#7ea56a]">
                    ${costs.remainingBalance.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

            </div>

            {/* Talón de Control / Control Stub (4 columnas) */}
            <div className="lg:col-span-4 bg-[#faf8f3] p-6 sm:p-8 flex flex-col items-center justify-between text-center gap-6 relative">
              
              {/* Código de Reserva Destacado */}
              <div className="flex flex-col items-center gap-2 w-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#55665c]">
                  Código Oficial de Verificación
                </span>
                
                <div className="w-full bg-[#13201a] text-[#dceb6b] p-3 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                  <span className="font-mono font-black text-xl tracking-wider select-all">
                    {bookingState.bookingCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    title="Copiar código"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="size-4 text-[#dceb6b]" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Realistic Vector QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white p-4 rounded-2xl border-2 border-[#13201a] shadow-md flex items-center justify-center relative">
                  {/* SVG QR Code Simulation with Center Mountain Logo */}
                  <svg
                    viewBox="0 0 140 140"
                    className="size-32 text-[#13201a]"
                    fill="currentColor"
                  >
                    {/* Top-Left Finder */}
                    <rect x="10" y="10" width="35" height="35" fill="#13201a" rx="4" />
                    <rect x="17" y="17" width="21" height="21" fill="#ffffff" rx="2" />
                    <rect x="23" y="23" width="9" height="9" fill="#13201a" rx="1" />

                    {/* Top-Right Finder */}
                    <rect x="95" y="10" width="35" height="35" fill="#13201a" rx="4" />
                    <rect x="102" y="17" width="21" height="21" fill="#ffffff" rx="2" />
                    <rect x="108" y="23" width="9" height="9" fill="#13201a" rx="1" />

                    {/* Bottom-Left Finder */}
                    <rect x="10" y="95" width="35" height="35" fill="#13201a" rx="4" />
                    <rect x="17" y="102" width="21" height="21" fill="#ffffff" rx="2" />
                    <rect x="23" y="108" width="9" height="9" fill="#13201a" rx="1" />

                    {/* Data matrix dots */}
                    <rect x="52" y="12" width="6" height="6" />
                    <rect x="64" y="12" width="6" height="6" />
                    <rect x="76" y="12" width="6" height="6" />
                    <rect x="52" y="24" width="6" height="6" />
                    <rect x="76" y="24" width="6" height="6" />
                    <rect x="64" y="36" width="6" height="6" />

                    <rect x="12" y="52" width="6" height="6" />
                    <rect x="24" y="52" width="6" height="6" />
                    <rect x="36" y="64" width="6" height="6" />
                    <rect x="12" y="76" width="6" height="6" />
                    <rect x="36" y="76" width="6" height="6" />

                    {/* Center Area */}
                    <rect x="52" y="52" width="36" height="36" rx="8" fill="#dceb6b" />
                    <circle cx="70" cy="70" r="10" fill="#13201a" />

                    <rect x="96" y="52" width="6" height="6" />
                    <rect x="108" y="64" width="6" height="6" />
                    <rect x="120" y="52" width="6" height="6" />
                    <rect x="96" y="76" width="6" height="6" />
                    <rect x="120" y="76" width="6" height="6" />

                    <rect x="52" y="96" width="6" height="6" />
                    <rect x="64" y="108" width="6" height="6" />
                    <rect x="76" y="96" width="6" height="6" />
                    <rect x="52" y="120" width="6" height="6" />
                    <rect x="76" y="120" width="6" height="6" />

                    <rect x="96" y="96" width="6" height="6" />
                    <rect x="108" y="96" width="6" height="6" />
                    <rect x="120" y="108" width="6" height="6" />
                    <rect x="96" y="120" width="6" height="6" />
                    <rect x="114" y="120" width="6" height="6" />
                  </svg>
                </div>
                <span className="text-[10px] text-[#55665c] font-semibold">
                  Escanear en Puesto de Control PNN
                </span>
              </div>

              {/* Barcode & Signature */}
              <div className="w-full flex flex-col items-center gap-1 border-t border-[#e2dcd0] pt-4">
                <div className="flex items-center justify-center gap-1 h-6 w-full px-4 opacity-70">
                  {[3, 1, 4, 1, 2, 5, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 5, 1, 3].map((w, i) => (
                    <div
                      key={i}
                      className="h-full bg-[#13201a]"
                      style={{ width: `${w * 2}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[9px] text-[#55665c] tracking-widest uppercase">
                  POL-992834-COLASISTENCIA
                </span>
              </div>

            </div>

          </div>

          {/* Footer del Voucher con Aviso Legal */}
          <div className="bg-[#f0ece2] px-6 sm:px-8 py-3.5 border-t border-[#e2dcd0] flex flex-wrap items-center justify-between text-[11px] text-[#55665c] gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="size-4 text-[#7ea56a]" />
              <span>Seguro de asistencia médica en montaña incluido. Válido solo con documento original.</span>
            </span>
            <span className="font-bold text-[#13201a]">
              NativaTrips & Parques Nacionales Naturales de Colombia
            </span>
          </div>

        </div>

        {/* ── BOTONES DE ACCIÓN RÁPIDA (IMPRIMIR, WHATSAPP, CALENDARIO, EMAIL) ── */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="bg-[#13201a] hover:bg-black active:scale-95 text-[#dceb6b] font-['Outfit:Bold'] font-bold text-xs sm:text-sm px-5 py-3 rounded-full flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Imprimir / Descargar Voucher PDF</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white font-['Outfit:Bold'] font-bold text-xs sm:text-sm px-5 py-3 rounded-full flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Share2 className="size-4" />
            <span>Compartir por WhatsApp</span>
          </button>

          <button
            onClick={handleAddToGoogleCalendar}
            className="bg-white border border-[#13201a] hover:bg-[#faf8f3] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-xs sm:text-sm px-5 py-3 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="size-4" />
            <span>Añadir a Google Calendar</span>
          </button>

          <button
            onClick={handleSendEmail}
            className="bg-white border border-[#cfcebf] hover:bg-[#faf8f3] active:scale-95 text-[#55665c] hover:text-[#13201a] font-semibold text-xs sm:text-sm px-4 py-3 rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Mail className="size-4" />
            <span>{emailSent ? '✓ Enviado' : 'Reenviar Email'}</span>
          </button>
        </div>

        {/* ── SIGUIENTE PASO OBLIGATORIO: GUÍA PRE-TOUR DE ALTA MONTAÑA ── */}
        <div className="bg-[#13201a] text-white p-6 sm:p-8 rounded-3xl w-full flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 size-60 bg-[#dceb6b]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 bg-[#dceb6b]/15 px-3 py-1 rounded-full w-fit border border-[#dceb6b]/30">
              <Sparkles className="size-3 text-[#dceb6b]" />
              <span className="text-[10px] font-bold text-[#dceb6b] uppercase tracking-wider">
                Paso Imprescindible
              </span>
            </div>

            <h3 className="font-['Outfit:Bold'] font-bold text-xl sm:text-2xl text-white">
              Prepara tu morral e indumentaria técnica
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-lg leading-relaxed">
              En el páramo la temperatura puede descender a 4°C y la radiación UV es extrema. Completa el checklist interactivo de 10 elementos indispensables antes de viajar.
            </p>
          </div>

          <button
            onClick={() => navigate('/pre-tour')}
            className="relative z-10 bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-sm px-7 py-4 rounded-full flex items-center gap-2 shrink-0 shadow-lg cursor-pointer transition-all"
          >
            <span>Ir a la Guía Pre-Tour</span>
            <ArrowUpRight className="size-4" />
          </button>
        </div>

        {/* ── INFORMACIÓN DE SOPORTE Y CONTACTO DIRECTO ── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#55665c] no-print">
          <div className="bg-white p-5 rounded-2xl border border-[#e6e1d5] flex flex-col gap-2.5">
            <span className="font-bold text-[#13201a] text-sm flex items-center gap-2">
              <Clock className="size-4 text-[#7ea56a]" />
              <span>Cronograma Previo al Recorrido</span>
            </span>
            <p><strong>48 horas antes:</strong> Te contactaremos vía WhatsApp con el reporte del clima actualizado de la semana.</p>
            <p><strong>24 horas antes:</strong> Recibirás los datos exactos del guía asignado (nombre, celular y placa del transporte si aplica).</p>
            <p><strong>El día del tour:</strong> Llegada 5:45 AM para registro de huella biométrica y verificación de cédula.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#e6e1d5] flex flex-col gap-2.5">
            <span className="font-bold text-[#13201a] text-sm flex items-center gap-2">
              <PhoneCall className="size-4 text-[#7ea56a]" />
              <span>Líneas de Asistencia y Emergencias</span>
            </span>
            <p>Para cambios de fecha o dudas sobre tu seguro, escríbenos citando tu código <strong>{bookingState.bookingCode}</strong>.</p>
            <div className="flex flex-col gap-1.5 pt-1">
              <a
                href={`https://wa.me/573124567890?text=Hola,%20tengo%20preguntas%20sobre%20mi%20reserva%20${bookingState.bookingCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[#2e7d32] hover:underline"
              >
                <MessageCircle className="size-4" />
                <span>WhatsApp Soporte Nativa: (+57) 312 456-7890</span>
              </a>
              <span className="text-[11px] text-[#7ea56a]">
                Radio Guardaparques Chingaza: VHF Canal 3 (Frecuencia 146.520 MHz)
              </span>
            </div>
          </div>
        </div>

      </main>

    </div>
  );
};

export default BookingConfirmationPage;
