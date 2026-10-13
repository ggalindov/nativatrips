import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import {
  Mountain,
  Lock,
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Check,
  Info,
  HelpCircle,
  Sparkles,
  CreditCard as CardIcon
} from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state: bookingState,
    setSelectedGateway,
    setPaymentSubMethod,
    setPaymentStatus,
    incrementPaymentAttempt,
    calculateCosts,
    updateLeadVisitor
  } = useBooking();
  const { user } = useAuth();

  const costs = calculateCosts();

  // Local form state
  const [selectedGatewayLocal, setSelectedGatewayLocal] = useState<'payu' | 'wompi'>(
    bookingState.selectedGateway || 'payu'
  );
  const [subMethod, setSubMethod] = useState<'card' | 'pse' | 'nequi'>('card');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [simulateOutcome, setSimulateOutcome] = useState<'success' | 'decline'>('success');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Credit Card Form
  const [cardNumber, setCardNumber] = useState('4532 8921 7741 8842');
  const [cardHolder, setCardHolder] = useState(bookingState.leadVisitor.fullName || 'Juan Sebastián Mora');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvc, setCardCvc] = useState('389');
  const [installments, setInstallments] = useState('1');

  // PSE Form
  const [pseBank, setPseBank] = useState('Bancolombia');
  const [psePersonType, setPsePersonType] = useState('natural');

  // Nequi Form
  const [nequiPhone, setNequiPhone] = useState(bookingState.leadVisitor.phone || '3124567890');

  // Billing details (editable)
  const [billingName, setBillingName] = useState(bookingState.leadVisitor.fullName);
  const [billingEmail, setBillingEmail] = useState(bookingState.leadVisitor.email);
  const [billingDoc, setBillingDoc] = useState(bookingState.leadVisitor.docNumber);
  const [billingPhone, setBillingPhone] = useState(bookingState.leadVisitor.phone);

  // Processing simulation state
  const [processingProgress, setProcessingProgress] = useState(15);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle gateway switch
  const handleGatewayChange = (gw: 'payu' | 'wompi') => {
    setSelectedGatewayLocal(gw);
    setSelectedGateway(gw);
    if (gw === 'wompi' && subMethod === 'card') {
      setSubMethod('nequi');
    }
  };

  // Submit payment handler
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setToastMessage('Debes aceptar los Términos y Condiciones para continuar.');
      return;
    }

    updateLeadVisitor({
      fullName: billingName,
      email: billingEmail,
      docNumber: billingDoc,
      phone: billingPhone
    });

    setPaymentStatus('processing');
    setProcessingProgress(20);

    const progressTimer = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 25;
      });
    }, 500);

    setTimeout(() => {
      clearInterval(progressTimer);
      if (simulateOutcome === 'decline' && bookingState.paymentAttemptCount === 0) {
        incrementPaymentAttempt();
        setPaymentStatus('declined');
        setErrorMessage('Fondos insuficientes en la tarjeta seleccionada o rechazo de seguridad de tu entidad bancaria.');
      } else {
        setPaymentStatus('approved');
        navigate('/confirmacion');
      }
    }, 2400);
  };

  return (
    <div className="bg-[#f5f1e7] flex flex-col items-start w-full min-h-screen text-[#13201a] bg-topo-light">
      
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="warning"
          onClose={() => setToastMessage(null)}
        />
      )}



      {/* ── BREADCRUMBS ── */}
      <div className="w-full max-w-6xl mx-auto px-6 sm:px-12 pt-6 flex items-center gap-2 text-xs text-[#5e6c64]">
        <span className="cursor-pointer hover:underline" onClick={() => navigate('/reservas')}>
          1. Datos de Reserva
        </span>
        <ChevronRight className="size-3" />
        <span className="font-bold text-[#13201a]">2. Pasarela de Pago Seguro</span>
        <ChevronRight className="size-3" />
        <span className="text-[#a0a8a3]">3. Confirmación</span>
      </div>

      {/* ── ESTADO 1B: PROCESANDO PAGO CON ONDAS CONCÉNTRICAS ── */}
      {bookingState.paymentStatus === 'processing' && (
        <main className="w-full max-w-xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="bg-white p-10 sm:p-12 rounded-3xl shadow-2xl border border-[#e5dfd2] w-full flex flex-col items-center gap-6 relative overflow-hidden">
            
            <div className="relative size-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#dceb6b]/40 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-[#e2dcd0] border-t-[#13201a] animate-spin" />
              <ShieldCheck className="size-9 text-[#7ea56a] relative z-10" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a]">
                Verificando transacción bancaria...
              </h2>
              <p className="text-xs sm:text-sm text-[#5e6c64] leading-relaxed">
                Estamos validando tu pago de forma segura con la pasarela {selectedGatewayLocal === 'payu' ? 'PayU Colombia' : 'Wompi Bancolombia'}. Por favor no cierres esta ventana.
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#f2ede4] h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${processingProgress}%` }}
                className="bg-[#dceb6b] h-full transition-all duration-300 rounded-full shadow-sm"
              />
            </div>

            {/* Dynamic Verification Step Message */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5e6c64]">
              <Sparkles className="size-3.5 text-[#7ea56a] animate-spin" />
              <span>
                {processingProgress < 40 && 'Validando token bancario y protocolo 3D Secure...'}
                {processingProgress >= 40 && processingProgress < 75 && 'Conectando con el registro oficial de Parques Nacionales...'}
                {processingProgress >= 75 && 'Emitiendo póliza de asistencia Colasistencia y asegurando cupo...'}
              </span>
            </div>

            <div className="bg-[#f5f1e7] px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-[#13201a]">
              <Lock className="size-3.5 text-[#7ea56a]" />
              <span>Conexión Encriptada TLS 1.3 · Verificación Antifraude</span>
            </div>
          </div>
        </main>
      )}

      {/* ── ESTADO 2: PAGO RECHAZADO / DECLINED CON REINTENTO ── */}
      {bookingState.paymentStatus === 'declined' && (
        <main className="w-full max-w-5xl mx-auto px-6 sm:px-12 py-10 flex flex-col gap-8 animate-fade-in">
          <div className="bg-[#fdf2f2] border-2 border-[#9b1c1c] p-6 rounded-3xl flex items-start gap-4 shadow-sm">
            <div className="bg-[#9b1c1c] size-11 rounded-2xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
              <AlertTriangle className="size-6" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <h3 className="font-bold text-base sm:text-lg text-[#9b1c1c]">
                Transacción rechazada por la entidad bancaria
              </h3>
              <p className="text-sm text-[#771d1d] leading-relaxed">
                Motivo: {errorMessage || 'Fondos insuficientes o bloqueo temporal preventivo de seguridad.'}
              </p>
              <div className="mt-2 text-xs font-bold text-[#9a3412] bg-[#ffedd5] px-3.5 py-1.5 rounded-xl w-fit">
                ⚠️ Tienes 1 intento restante antes de que el cupo sea liberado automáticamente.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-[#e5dfd2] flex flex-col gap-6">
              <div className="border-b border-[#eae5da] pb-3">
                <span className="text-xs font-extrabold text-[#7ea56a] uppercase">Reintento Inmediato</span>
                <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                  Elige un método alternativo para asegurar tu cupo
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGatewayLocal('payu');
                    setSubMethod('pse');
                    setPaymentStatus('checkout');
                  }}
                  className="p-4 rounded-2xl border-2 border-[#13201a] hover:bg-[#fbf9f4] flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-[#13201a] size-10 rounded-xl flex items-center justify-center text-white">
                      <Building2 className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#13201a]">Intentar con PSE (Débito Bancario)</p>
                      <p className="text-xs text-[#5e6c64]">Débito inmediato desde cualquier cuenta de ahorros colombiana</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGatewayLocal('wompi');
                    setSubMethod('nequi');
                    setPaymentStatus('checkout');
                  }}
                  className="p-4 rounded-2xl border-2 border-[#13201a] hover:bg-[#fbf9f4] flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="bg-[#13201a] size-10 rounded-xl flex items-center justify-center text-white">
                      <Smartphone className="size-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#13201a]">Pagar con Nequi (Wompi)</p>
                      <p className="text-xs text-[#5e6c64]">Notificación directa a tu app de celular Nequi</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#eae5da]">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('checkout');
                    setSimulateOutcome('success');
                  }}
                  className="text-xs font-bold text-[#13201a] underline cursor-pointer"
                >
                  ← Volver a probar con otra tarjeta
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/senderos')}
                  className="text-xs font-bold text-[#c62828] hover:underline cursor-pointer"
                >
                  Cancelar reserva y liberar cupo
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#fbf9f5] p-6 rounded-3xl border border-[#e5dfd2] flex flex-col gap-4">
              <span className="text-xs font-bold text-[#5e6c64] uppercase">Tu Cupo en Riesgo</span>
              <h4 className="font-bold text-lg text-[#13201a]">{bookingState.trailName}</h4>
              <p className="text-xs text-[#5e6c64]">{bookingState.trailDate} · {bookingState.memberCount} persona(s)</p>
              <div className="bg-[#13201a] text-white p-4 rounded-2xl flex items-center justify-between mt-2">
                <span className="text-xs">Anticipo pendiente:</span>
                <span className="text-xl font-extrabold text-[#dceb6b]">
                  ${costs.depositRequired.toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── ESTADO 1: CHECKOUT CON TARJETA VIRTUAL INTERACTIVA ── */}
      {bookingState.paymentStatus === 'checkout' && (
        <main className="w-full max-w-6xl mx-auto px-6 sm:px-12 py-8 flex flex-col gap-8 animate-fade-in">
          
          {/* Urgency countdown bar with outcome simulator */}
          <div className="bg-[#fff7ed] border border-[#ffedd5] px-6 py-3.5 rounded-2xl flex items-center justify-between gap-4 text-xs sm:text-sm shadow-sm">
            <div className="flex items-center gap-2.5 text-[#9a3412]">
              <Clock className="size-4 shrink-0" />
              <span className="font-bold">Tu cupo expira en 11:42</span>
              <span className="hidden md:inline text-zinc-500">— Completa tu anticipo para asegurar las entradas y seguro PNN.</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Simulador de prueba:</span>
              <select
                value={simulateOutcome}
                onChange={(e) => setSimulateOutcome(e.target.value as 'success' | 'decline')}
                className="bg-white border border-[#e2dcd0] text-[11px] font-bold rounded-xl px-2.5 py-1 outline-none text-[#13201a] cursor-pointer"
              >
                <option value="success">✓ Simular Pago Exitoso</option>
                <option value="decline">✕ Simular Rechazo Bancario</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleInitiatePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── COLUMNA IZQUIERDA: PASARELA Y FORMULARIO CON TARJETA VIRTUAL ── */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Card 1: Selección de Pasarela */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0px_8px_24px_rgba(19,32,26,0.05)] border border-[#e5dfd2] flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase font-extrabold text-[#7ea56a] tracking-wider">
                    Método de Pago
                  </span>
                  <h2 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                    Selecciona tu Pasarela Segura
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => handleGatewayChange('payu')}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${
                      selectedGatewayLocal === 'payu'
                        ? 'border-[#13201a] bg-[#fbf9f4] shadow-sm ring-1 ring-[#13201a]'
                        : 'border-[#e2dcd0] bg-white hover:border-[#cfcebf]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xl tracking-tight text-[#13201a]">PayU</span>
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGatewayLocal === 'payu' ? 'border-[#13201a] bg-[#13201a]' : 'border-[#cfcebf]'
                      }`}>
                        {selectedGatewayLocal === 'payu' && <div className="size-2 rounded-full bg-[#dceb6b]" />}
                      </div>
                    </div>
                    <p className="text-xs text-[#5e6c64]">
                      Tarjetas de crédito/débito, PSE de cualquier banco y efectivo (Efecty / Baloto).
                    </p>
                  </div>

                  <div
                    onClick={() => handleGatewayChange('wompi')}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 cursor-pointer ${
                      selectedGatewayLocal === 'wompi'
                        ? 'border-[#13201a] bg-[#fbf9f4] shadow-sm ring-1 ring-[#13201a]'
                        : 'border-[#e2dcd0] bg-white hover:border-[#cfcebf]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xl tracking-tight text-[#13201a] lowercase">wompi</span>
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                        selectedGatewayLocal === 'wompi' ? 'border-[#13201a] bg-[#13201a]' : 'border-[#cfcebf]'
                      }`}>
                        {selectedGatewayLocal === 'wompi' && <div className="size-2 rounded-full bg-[#dceb6b]" />}
                      </div>
                    </div>
                    <p className="text-xs text-[#5e6c64]">
                      Bancolombia, Nequi directo con notificación al celular, Transfiya y tarjetas.
                    </p>
                  </div>
                </div>

                {/* Submethod Tabs */}
                <div className="flex items-center gap-2 border-b border-[#eae5da] pb-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubMethod('card')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subMethod === 'card'
                        ? 'bg-[#13201a] text-white shadow-sm'
                        : 'text-[#5e6c64] hover:text-[#13201a]'
                    }`}
                  >
                    <CreditCard className="size-3.5" />
                    <span>Tarjeta Crédito / Débito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubMethod('pse')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subMethod === 'pse'
                        ? 'bg-[#13201a] text-white shadow-sm'
                        : 'text-[#5e6c64] hover:text-[#13201a]'
                    }`}
                  >
                    <Building2 className="size-3.5" />
                    <span>PSE Débito Bancario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubMethod('nequi')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subMethod === 'nequi'
                        ? 'bg-[#13201a] text-white shadow-sm'
                        : 'text-[#5e6c64] hover:text-[#13201a]'
                    }`}
                  >
                    <Smartphone className="size-3.5" />
                    <span>Nequi Celular</span>
                  </button>
                </div>

                {/* SUBMETHOD FORM 1: TARJETA CON PREVIEW VIRTUAL INTERACTIVA */}
                {subMethod === 'card' && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    
                    {/* Interactive 3D Simulated Credit Card Preview */}
                    <div className="w-full max-w-sm mx-auto h-48 rounded-3xl bg-gradient-to-tr from-[#13201a] via-[#173f35] to-[#0c2b25] text-white p-6 shadow-2xl flex flex-col justify-between border border-white/20 relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 size-36 bg-[#dceb6b]/15 rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mountain className="size-5 text-[#dceb6b]" />
                          <span className="font-['Outfit:Bold'] font-bold text-xs uppercase tracking-wider text-white/90">
                            Nativa Card
                          </span>
                        </div>
                        <span className="text-xs font-black tracking-widest text-[#dceb6b]">VISA / MC</span>
                      </div>

                      <div className="font-mono text-lg sm:text-xl tracking-widest text-center text-white/95 font-bold my-auto">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/80 font-mono">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider block text-white/50">Titular</span>
                          <span className="font-semibold truncate max-w-[160px] block">{cardHolder || 'NOMBRE TITULAR'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider block text-white/50">Vence</span>
                          <span className="font-semibold">{cardExpiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#5e6c64] uppercase">Número de la Tarjeta</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="native-input-box font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                        <label className="text-xs font-bold text-[#5e6c64] uppercase">Titular</label>
                        <input
                          type="text"
                          required
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Nombre como en la tarjeta"
                          className="native-input-box"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#5e6c64] uppercase">Vencimiento</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="native-input-box font-mono text-center"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#5e6c64] uppercase">CVC / CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="•••"
                          className="native-input-box font-mono text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#5e6c64]">
                      <span>Cuotas:</span>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="bg-[#f5f1e7] border border-[#e2dcd0] rounded-xl px-3 py-1.5 text-xs font-bold text-[#13201a] outline-none"
                      >
                        <option value="1">1 Cuota (Sin intereses)</option>
                        <option value="2">2 Cuotas</option>
                        <option value="3">3 Cuotas</option>
                        <option value="6">6 Cuotas</option>
                        <option value="12">12 Cuotas</option>
                      </select>
                      <span className="text-[11px] text-[#7ea56a] font-semibold">
                        (${Math.round(costs.depositRequired / Number(installments)).toLocaleString('es-CO')} / mes)
                      </span>
                    </div>
                  </div>
                )}

                {/* SUBMETHOD FORM 2: PSE */}
                {subMethod === 'pse' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-[#5e6c64] uppercase">Bancos Más Utilizados</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Bancolombia', 'Davivienda', 'Nequi PSE', 'Banco de Bogotá'].map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setPseBank(bank)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                              pseBank === bank
                                ? 'bg-[#13201a] text-[#dceb6b] border-[#13201a] shadow-sm'
                                : 'bg-[#faf8f3] text-[#13201a] border-[#e2dcd0] hover:border-[#13201a]'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#5e6c64] uppercase">O selecciona otro banco</label>
                      <select
                        value={pseBank}
                        onChange={(e) => setPseBank(e.target.value)}
                        className="native-input-box"
                      >
                        <option value="Bancolombia">Bancolombia</option>
                        <option value="Davivienda">Davivienda</option>
                        <option value="Banco de Bogotá">Banco de Bogotá</option>
                        <option value="BBVA Colombia">BBVA Colombia</option>
                        <option value="Banco de Occidente">Banco de Occidente</option>
                        <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                        <option value="Nequi PSE">Nequi (vía PSE)</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Lulo Bank">Lulo Bank</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-6 text-xs font-semibold text-[#13201a]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="personType"
                          checked={psePersonType === 'natural'}
                          onChange={() => setPsePersonType('natural')}
                        />
                        <span>Persona Natural</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="personType"
                          checked={psePersonType === 'juridica'}
                          onChange={() => setPsePersonType('juridica')}
                        />
                        <span>Persona Jurídica (Empresa)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* SUBMETHOD FORM 3: NEQUI */}
                {subMethod === 'nequi' && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#5e6c64] uppercase">Número de Celular Nequi</label>
                      <input
                        type="tel"
                        required
                        value={nequiPhone}
                        onChange={(e) => setNequiPhone(e.target.value)}
                        placeholder="312 456 7890"
                        className="native-input-box font-mono"
                      />
                    </div>
                    <p className="text-xs text-[#5e6c64]">
                      Te enviaremos una notificación push a tu aplicación Nequi para que autorices el pago con tu clave dinámica.
                    </p>
                  </div>
                )}

              </div>

              {/* Card 2: Datos de Facturación (Inputs Reales) */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0px_8px_24px_rgba(19,32,26,0.05)] border border-[#e5dfd2] flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase font-extrabold text-[#7ea56a] tracking-wider">
                    Titular y Facturación
                  </span>
                  <h3 className="text-xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                    Información para el Comprobante DIAN
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e6c64] uppercase">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={billingName}
                      onChange={(e) => setBillingName(e.target.value)}
                      className="native-input-box text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e6c64] uppercase">Correo de Confirmación</label>
                    <input
                      type="email"
                      required
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      className="native-input-box text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e6c64] uppercase">Documento de Identidad</label>
                    <input
                      type="text"
                      required
                      value={billingDoc}
                      onChange={(e) => setBillingDoc(e.target.value)}
                      className="native-input-box text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e6c64] uppercase">Teléfono Celular</label>
                    <input
                      type="tel"
                      required
                      value={billingPhone}
                      onChange={(e) => setBillingPhone(e.target.value)}
                      className="native-input-box text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="size-4 mt-0.5 text-[#13201a] rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-[#5e6c64] leading-relaxed">
                    Acepto los <a href="#" className="underline text-[#13201a] font-bold">Términos del Servicio</a>, la <a href="#" className="underline text-[#13201a] font-bold">Política de Tratamiento de Datos</a> y la normativa de Parques Nacionales Naturales de Colombia.
                  </span>
                </label>
              </div>

            </div>

            {/* ── COLUMNA DERECHA: RESUMEN DE COMPRA & BOTÓN DE PAGO ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
              
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0px_12px_36px_rgba(19,32,26,0.06)] border border-[#e5dfd2] flex flex-col gap-6">
                <div>
                  <span className="text-xs uppercase font-extrabold text-[#7ea56a] tracking-wider">
                    Resumen del Pedido
                  </span>
                  <h3 className="text-2xl font-bold font-['Outfit:Bold'] text-[#13201a] mt-0.5">
                    Detalle de tu Pago
                  </h3>
                </div>

                <div className="flex items-center gap-4 bg-[#fbf9f5] p-3.5 rounded-2xl border border-[#ede8dd]">
                  <img
                    alt={bookingState.trailName}
                    src={bookingState.trailImage}
                    className="size-16 rounded-xl object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#080f0c]">{bookingState.trailName}</span>
                    <span className="text-xs text-[#5e6c64]">{bookingState.trailSector}</span>
                    <span className="text-xs font-semibold text-[#7ea56a] mt-0.5">{bookingState.trailDate}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs sm:text-sm text-[#5e6c64] border-t border-[#eae5da] pt-4">
                  <div className="flex justify-between">
                    <span>Entradas ({bookingState.memberCount} visitantes):</span>
                    <span className="font-semibold text-[#13201a]">${costs.trailTotal.toLocaleString('es-CO')} COP</span>
                  </div>

                  {bookingState.needTransport && (
                    <div className="flex justify-between">
                      <span>Transporte Bogotá ({bookingState.memberCount} pers.):</span>
                      <span className="font-semibold text-[#13201a]">${costs.transportTotal.toLocaleString('es-CO')} COP</span>
                    </div>
                  )}

                  {bookingState.needLunch && (
                    <div className="flex justify-between">
                      <span>Almuerzo de campo ({bookingState.memberCount} pers.):</span>
                      <span className="font-semibold text-[#13201a]">${costs.lunchTotal.toLocaleString('es-CO')} COP</span>
                    </div>
                  )}

                  <div className="border-t border-[#eae5da] pt-3 flex justify-between font-bold text-sm text-[#13201a]">
                    <span>Total del paquete:</span>
                    <span>${costs.subtotal.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                {/* TOTAL A PAGAR HOY HIGHLIGHT CON PULSO SUAVE */}
                <div className="bg-[#dceb6b] p-5 rounded-2xl flex flex-col gap-1 text-[#13201a] shadow-md animate-pulse-glow">
                  <span className="text-xs uppercase font-extrabold tracking-wider">
                    Total a Pagar Hoy (Anticipo 50%)
                  </span>
                  <span className="text-3xl font-black font-['Unbounded:Black']">
                    ${costs.depositRequired.toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[11px] text-[#13201a]/80 mt-1 leading-snug">
                    * El saldo de ${costs.remainingBalance.toLocaleString('es-CO')} COP se cancela el día de la excursión directamente al guía local.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!termsAccepted}
                  className="w-full bg-[#13201a] hover:bg-black active:scale-95 disabled:opacity-50 text-[#dceb6b] font-['Outfit:Bold'] font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer"
                >
                  <Lock className="size-4" />
                  <span>Pagar ${costs.depositRequired.toLocaleString('es-CO')} COP ↗</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-[#5e6c64]">
                  <ShieldCheck className="size-4 text-[#7ea56a]" />
                  <span>Transacción protegida por {selectedGatewayLocal === 'payu' ? 'PayU' : 'Wompi'}</span>
                </div>
              </div>

            </div>

          </form>
        </main>
      )}

    </div>
  );
};

export default PaymentPage;
