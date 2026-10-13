import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import {
  Mountain,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  AlertCircle,
  Bus,
  Utensils,
  ChevronRight,
  Check,
  Calendar
} from 'lucide-react';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    setMemberCount,
    updateLeadVisitor,
    updateAdditionalMember,
    setNeedTransport,
    setNeedLunch,
    setSpecialRequirements,
    calculateCosts
  } = useBooking();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Countdown timer for Step 2 (15 minutes simulation)
  const [secondsLeft, setSecondsLeft] = useState(14 * 60 + 59);

  useEffect(() => {
    if (currentStep === 2) {
      const interval = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // If user is logged in and leadVisitor is default, autofill user details
  useEffect(() => {
    if (user && state.leadVisitor.email === 'juan.mora@example.com') {
      updateLeadVisitor({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        docNumber: user.docNumber
      });
    }
  }, [user]);

  // Costs calculation
  const costs = calculateCosts();

  // Validate Step 1 before proceeding
  const handleProceedToStep2 = () => {
    const errors: { [key: string]: string } = {};

    if (!state.leadVisitor.fullName.trim()) {
      errors.fullName = 'El nombre completo es obligatorio';
    }
    if (!state.leadVisitor.email.trim() || !state.leadVisitor.email.includes('@')) {
      errors.email = 'Ingresa un correo electrónico válido';
    }
    if (!state.leadVisitor.phone.trim()) {
      errors.phone = 'El teléfono es requerido para emergencias';
    }
    if (!state.leadVisitor.docNumber.trim()) {
      errors.docNumber = 'El documento es obligatorio para el seguro PNN';
    }

    // Check additional members
    state.additionalMembers.forEach((member, i) => {
      if (!member.name.trim()) {
        errors[`member_${i}_name`] = `Ingresa el nombre del Integrante ${i + 2}`;
      }
      if (!member.doc.trim()) {
        errors[`member_${i}_doc`] = `Ingresa el documento del Integrante ${i + 2}`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Smooth scroll to top error
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    setFormErrors({});
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#f5f1e7] flex flex-col items-start w-full min-h-screen text-[#13201a]">
      


      {/* ── CONTEXTO DEL SENDERO SELECCIONADO ── */}
      <div className="bg-[#0e1c15] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-12 lg:px-20 py-4 w-full gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="h-12 w-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-white/10">
            <img
              alt={state.trailName}
              src={state.trailImage}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-['Outfit:Bold'] font-bold text-base sm:text-lg text-white">
              {state.trailName}
            </span>
            <span className="text-xs text-white/70 font-['Inter:Regular']">
              {state.trailSector} · {state.duration}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end sm:self-auto">
          <div className="flex flex-col items-end text-xs">
            <span className="text-white/50 uppercase tracking-wider text-[10px]">Fecha de visita</span>
            <span className="font-semibold text-white text-sm">{state.trailDate}</span>
          </div>
          <div className="bg-[#dceb6b]/15 border border-[#dceb6b] px-3 py-1.5 rounded-lg text-xs font-bold text-[#dceb6b] whitespace-nowrap">
            {state.availableSlots} cupos disponibles
          </div>
        </div>
      </div>

      {/* ── STEPPER DE PROGRESO ── */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 sm:px-12 lg:px-20 w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between w-full">
          
          {/* Step 1 Indicator */}
          <div 
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 cursor-pointer transition-opacity ${currentStep === 1 ? 'opacity-100' : 'opacity-80'}`}
          >
            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              currentStep === 1 
                ? 'bg-[#dceb6b] text-[#13201a] shadow-md ring-4 ring-[#dceb6b]/20' 
                : 'bg-[#13201a] text-white'
            }`}>
              {currentStep === 2 ? <Check className="size-4 text-[#dceb6b]" /> : '1'}
            </div>
            <span className="font-['Outfit:Bold'] font-bold text-sm sm:text-base text-[#13201a]">
              1. Datos del grupo
            </span>
          </div>

          {/* Stepper connecting line */}
          <div className="flex-1 mx-4 h-0.5 bg-[#d5d0c2] relative overflow-hidden">
            <div className={`h-full bg-[#13201a] transition-all duration-500 ${currentStep === 2 ? 'w-full' : 'w-0'}`} />
          </div>

          {/* Step 2 Indicator */}
          <div className={`flex items-center gap-3 transition-opacity ${currentStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              currentStep === 2 
                ? 'bg-[#dceb6b] text-[#13201a] shadow-md ring-4 ring-[#dceb6b]/20' 
                : 'border border-[#5e6c64] text-[#5e6c64]'
            }`}>
              2
            </div>
            <span className="font-['Outfit:Bold'] font-bold text-sm sm:text-base text-[#13201a]">
              2. Confirmar reserva
            </span>
          </div>

        </div>
      </div>

      {/* ── STEP 1: FORMULARIO INTERACTIVO (NO CUADROS FIJOS) ── */}
      {currentStep === 1 && (
        <main className="w-full max-w-4xl mx-auto px-6 sm:px-12 pb-20 animate-fade-in">
          <div className="bg-white shadow-[0px_12px_36px_rgba(19,32,26,0.06)] rounded-3xl p-6 sm:p-10 border border-[#e5e0d3] flex flex-col gap-10">
            
            {/* Header info */}
            <div className="border-b border-[#eae5da] pb-4">
              <span className="text-xs uppercase font-extrabold text-[#7ea56a] tracking-wider">
                Paso 1 de 2
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13201a] font-['Outfit:Bold']">
                Información de los Visitantes
              </h2>
              <p className="text-xs sm:text-sm text-[#5e6c64] mt-1">
                Los datos solicitados son obligatorios para la expedición de pólizas de rescate y control de ingreso con Parques Nacionales Naturales de Colombia.
              </p>
            </div>

            {/* SECCIÓN: TITULAR DE LA RESERVA (INPUTS REALES) */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-[#f0ece2] pb-2">
                <span className="size-2 rounded-full bg-[#7ea56a]" />
                <h3 className="font-['Outfit:Bold'] font-bold text-xs uppercase tracking-wider text-[#13201a]">
                  Titular de la Reserva (Responsable principal)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Input: Nombre Completo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5e6c64] uppercase">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Sebastián Mora"
                    value={state.leadVisitor.fullName}
                    onChange={(e) => updateLeadVisitor({ fullName: e.target.value })}
                    className={`native-input-box ${formErrors.fullName ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''}`}
                  />
                  {formErrors.fullName && (
                    <span className="text-xs text-[#d32f2f] font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> {formErrors.fullName}
                    </span>
                  )}
                </div>

                {/* Input: Correo Electrónico */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5e6c64] uppercase">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. juan.mora@example.com"
                    value={state.leadVisitor.email}
                    onChange={(e) => updateLeadVisitor({ email: e.target.value })}
                    className={`native-input-box ${formErrors.email ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''}`}
                  />
                  {formErrors.email && (
                    <span className="text-xs text-[#d32f2f] font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> {formErrors.email}
                    </span>
                  )}
                </div>

                {/* Input: Teléfono WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5e6c64] uppercase">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +57 312 456 7890"
                    value={state.leadVisitor.phone}
                    onChange={(e) => updateLeadVisitor({ phone: e.target.value })}
                    className={`native-input-box ${formErrors.phone ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''}`}
                  />
                  {formErrors.phone && (
                    <span className="text-xs text-[#d32f2f] font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* Input: Documento de Identidad */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#5e6c64] uppercase">
                    Documento de Identidad (C.C. / P.A. / T.I.) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. C.C. 1.018.452.339"
                    value={state.leadVisitor.docNumber}
                    onChange={(e) => updateLeadVisitor({ docNumber: e.target.value })}
                    className={`native-input-box ${formErrors.docNumber ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''}`}
                  />
                  {formErrors.docNumber && (
                    <span className="text-xs text-[#d32f2f] font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> {formErrors.docNumber}
                    </span>
                  )}
                </div>

              </div>
            </div>

            {/* SECCIÓN: NÚMERO DE INTEGRANTES & CAMPOS DINÁMICOS */}
            <div className="flex flex-col gap-6 pt-4 border-t border-[#eae5da]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-['Outfit:Bold'] font-bold text-xs uppercase tracking-wider text-[#13201a]">
                    Grupo de Visitantes
                  </h3>
                  <p className="text-xs text-[#5e6c64] mt-0.5">
                    Incluye al titular de la reserva. (Máximo 8 cupos por grupo ecológico)
                  </p>
                </div>

                {/* Contador de personas */}
                <div className="flex items-center gap-3 bg-[#f5f1e7] p-2 rounded-2xl border border-[#e2dcd0]">
                  <button
                    type="button"
                    onClick={() => setMemberCount(Math.max(1, state.memberCount - 1))}
                    className="size-9 rounded-xl bg-white border border-[#d5d0c2] text-xl font-bold flex items-center justify-center hover:bg-[#e8e4da] active:scale-95 transition-all cursor-pointer"
                  >
                    –
                  </button>
                  <span className="font-extrabold text-xl w-8 text-center text-[#13201a]">
                    {state.memberCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMemberCount(Math.min(8, state.memberCount + 1))}
                    className="size-9 rounded-xl bg-white border border-[#d5d0c2] text-xl font-bold flex items-center justify-center hover:bg-[#e8e4da] active:scale-95 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CAMPOS DINÁMICOS PARA CADA INTEGRANTE ADICIONAL */}
              {state.additionalMembers.length > 0 && (
                <div className="flex flex-col gap-4 mt-2">
                  <span className="text-xs font-bold text-[#5e6c64] uppercase">
                    Datos de los acompañantes:
                  </span>

                  <div className="flex flex-col gap-4">
                    {state.additionalMembers.map((member, idx) => (
                      <div
                        key={idx}
                        className="bg-[#faf8f3] p-4 sm:p-5 rounded-2xl border border-[#ece7dc] flex flex-col gap-3 shadow-xs transition-all hover:border-[#13201a]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-['Outfit:Bold'] font-bold text-sm text-[#13201a] flex items-center gap-2">
                            <div className="bg-[#13201a] text-[#dceb6b] size-6 rounded-lg flex items-center justify-center text-xs font-bold">
                              {idx + 2}
                            </div>
                            <span>Acompañante {idx + 2}</span>
                          </span>
                          <span className="text-[10px] font-bold text-[#7ea56a] uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-full border border-[#ece7dc]">
                            Seguro PNN Incluido
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-[#5e6c64] uppercase">Nombre Completo *</label>
                            <input
                              type="text"
                              placeholder="Nombre y apellido..."
                              value={member.name}
                              onChange={(e) => updateAdditionalMember(idx, { name: e.target.value })}
                              className={`native-input-box text-xs py-2 ${
                                formErrors[`member_${idx}_name`] ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''
                              }`}
                            />
                            {formErrors[`member_${idx}_name`] && (
                              <span className="text-[10px] text-[#d32f2f] font-semibold">
                                {formErrors[`member_${idx}_name`]}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-[#5e6c64] uppercase">Cédula / Documento *</label>
                            <input
                              type="text"
                              placeholder="Número de documento..."
                              value={member.doc}
                              onChange={(e) => updateAdditionalMember(idx, { doc: e.target.value })}
                              className={`native-input-box text-xs py-2 ${
                                formErrors[`member_${idx}_doc`] ? 'border-[#d32f2f] ring-1 ring-[#d32f2f]' : ''
                              }`}
                            />
                            {formErrors[`member_${idx}_doc`] && (
                              <span className="text-[10px] text-[#d32f2f] font-semibold">
                                {formErrors[`member_${idx}_doc`]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN: SERVICIOS ADICIONALES (TOGGLES INTERACTIVOS) */}
            <div className="flex flex-col gap-5 pt-4 border-t border-[#eae5da]">
              <h3 className="font-['Outfit:Bold'] font-bold text-xs uppercase tracking-wider text-[#13201a]">
                Servicios Opcionales y Logística
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Toggle Transporte */}
                <label 
                  onClick={() => setNeedTransport(!state.needTransport)}
                  className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                    state.needTransport 
                      ? 'border-[#13201a] bg-[#fbf9f4] shadow-sm' 
                      : 'border-[#e2dcd0] bg-white hover:border-[#cfcebf]'
                  }`}
                >
                  <div className={`size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    state.needTransport ? 'bg-[#13201a] border-[#13201a]' : 'border-[#cfcebf] bg-white'
                  }`}>
                    {state.needTransport && <Check className="size-4 text-[#dceb6b]" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Bus className="size-4 text-[#7ea56a]" />
                      <span className="font-bold text-sm text-[#13201a]">Transporte Ida y Vuelta Bogotá</span>
                    </div>
                    <span className="text-xs text-[#5e6c64]">
                      Salida 5:00 AM desde Calle 72 con Cra 7 / Retorno al punto de inicio.
                    </span>
                    <span className="text-xs font-extrabold text-[#13201a] mt-1">
                      +$45.000 COP por persona
                    </span>
                  </div>
                </label>

                {/* Toggle Almuerzo */}
                <label 
                  onClick={() => setNeedLunch(!state.needLunch)}
                  className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                    state.needLunch 
                      ? 'border-[#13201a] bg-[#fbf9f4] shadow-sm' 
                      : 'border-[#e2dcd0] bg-white hover:border-[#cfcebf]'
                  }`}
                >
                  <div className={`size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    state.needLunch ? 'bg-[#13201a] border-[#13201a]' : 'border-[#cfcebf] bg-white'
                  }`}>
                    {state.needLunch && <Check className="size-4 text-[#dceb6b]" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Utensils className="size-4 text-[#7ea56a]" />
                      <span className="font-bold text-sm text-[#13201a]">Almuerzo Campesino de Montaña</span>
                    </div>
                    <span className="text-xs text-[#5e6c64]">
                      Preparado por familias locales en hoja de bijao (opción vegetariana disponible).
                    </span>
                    <span className="text-xs font-extrabold text-[#13201a] mt-1">
                      +$25.000 COP por persona
                    </span>
                  </div>
                </label>

              </div>
            </div>

            {/* SECCIÓN: REQUERIMIENTOS ESPECIALES (TEXTAREA REAL) */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#eae5da]">
              <label className="text-xs font-bold text-[#5e6c64] uppercase">
                Requerimientos Especiales / Condiciones Médicas
              </label>
              <textarea
                rows={3}
                placeholder="Alergias a alimentos o plantas, condiciones respiratorias, requerimiento de botiquín específico o menú vegetariano..."
                value={state.specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="native-input-box resize-none text-sm"
              />
            </div>

            {/* BARRA DE TOTAL Y ACCIÓN CONTINUAR */}
            <div className="bg-[#f5f1e7] p-6 rounded-2xl border border-[#e2dcd0] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#5e6c64] uppercase">
                  Total para {state.memberCount} persona(s)
                </span>
                <span className="text-2xl font-extrabold text-[#13201a]">
                  ${costs.subtotal.toLocaleString('es-CO')} COP
                </span>
                <span className="text-[11px] text-[#7ea56a] font-bold">
                  Anticipo para reservar: ${costs.depositRequired.toLocaleString('es-CO')} COP (50%)
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/senderos')}
                  className="px-5 py-3 rounded-full text-xs font-bold text-[#5e6c64] hover:text-[#13201a] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="flex-1 sm:flex-none bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-base px-8 py-4 rounded-full flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
                >
                  <span>Continuar al resumen</span>
                  <ArrowUpRight className="size-5" />
                </button>
              </div>
            </div>

          </div>
        </main>
      )}

      {/* ── STEP 2: CONFIRMAR RESERVA (RESUMEN INTERACTIVO) ── */}
      {currentStep === 2 && (
        <main className="w-full max-w-4xl mx-auto px-6 sm:px-12 pb-20 animate-fade-in flex flex-col gap-6">
          
          {/* Countdown Urgent Banner */}
          <div className="bg-[#fff7ed] border border-[#ffedd5] p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#e05c38] size-10 rounded-xl flex items-center justify-center text-white shrink-0">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#9a3412]">
                  Tus cupos están bloqueados temporalmente
                </p>
                <p className="text-xs text-[#9a3412]/80">
                  Completa tu anticipo para emitir las entradas oficiales antes de que expire la sesión.
                </p>
              </div>
            </div>

            <div className="bg-[#e05c38] px-4 py-2 rounded-xl text-white font-mono font-bold text-lg whitespace-nowrap shadow-inner">
              {formatTimer(secondsLeft)}
            </div>
          </div>

          {/* Main Summary Card */}
          <div className="bg-white shadow-[0px_12px_36px_rgba(19,32,26,0.06)] rounded-3xl p-6 sm:p-10 border border-[#e5e0d3] flex flex-col gap-8">
            
            <div className="flex items-center justify-between border-b border-[#eae5da] pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-[#7ea56a] tracking-wider">
                  Paso 2 de 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#13201a] font-['Outfit:Bold']">
                  Confirmación de la Reserva
                </h2>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="text-xs font-bold text-[#5e6c64] hover:text-[#13201a] underline cursor-pointer"
              >
                ← Modificar datos
              </button>
            </div>

            {/* Trail and meeting details */}
            <div className="bg-[#fbf9f5] p-6 rounded-2xl border border-[#ede8dd] flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold text-xl text-[#080f0c]">{state.trailName}</h3>
                <span className="text-xs font-bold bg-[#dceb6b] text-[#13201a] px-3 py-1 rounded-full">
                  {state.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm text-[#5e6c64] pt-2 border-t border-[#eae5da]">
                <div>
                  <span className="font-semibold text-[#13201a] block">Fecha y Hora:</span>
                  {state.trailDate}
                </div>
                <div>
                  <span className="font-semibold text-[#13201a] block">Punto de Encuentro:</span>
                  {state.meetingPoint}
                </div>
                <div>
                  <span className="font-semibold text-[#13201a] block">Grupo:</span>
                  {state.memberCount} persona(s)
                </div>
              </div>
            </div>

            {/* Visitors breakdown */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5e6c64]">
                Lista de Visitantes Registrados
              </span>
              <div className="bg-[#f7f5ef] p-4 rounded-xl text-xs sm:text-sm flex flex-col gap-2">
                <div className="flex items-center justify-between font-semibold text-[#13201a]">
                  <span>1. {state.leadVisitor.fullName} (Titular)</span>
                  <span className="text-[#5e6c64]">{state.leadVisitor.docNumber} · {state.leadVisitor.phone}</span>
                </div>
                {state.additionalMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[#5e6c64] border-t border-[#e2dcd0] pt-1.5">
                    <span>{idx + 2}. {m.name}</span>
                    <span>{m.doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial cost breakdown */}
            <div className="flex flex-col gap-3 border-t border-[#eae5da] pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5e6c64]">
                Desglose Financiero
              </span>

              <div className="flex flex-col gap-2 text-sm text-[#5e6c64]">
                <div className="flex justify-between">
                  <span>Entrada y seguro PNN ({state.memberCount} pers. x ${state.trailPricePerPerson.toLocaleString('es-CO')})</span>
                  <span className="font-semibold text-[#13201a]">${costs.trailTotal.toLocaleString('es-CO')} COP</span>
                </div>

                {state.needTransport && (
                  <div className="flex justify-between">
                    <span>Transporte privado Bogotá ({state.memberCount} pers. x ${state.transportPricePerPerson.toLocaleString('es-CO')})</span>
                    <span className="font-semibold text-[#13201a]">${costs.transportTotal.toLocaleString('es-CO')} COP</span>
                  </div>
                )}

                {state.needLunch && (
                  <div className="flex justify-between">
                    <span>Almuerzo campesino ({state.memberCount} pers. x ${state.lunchPricePerPerson.toLocaleString('es-CO')})</span>
                    <span className="font-semibold text-[#13201a]">${costs.lunchTotal.toLocaleString('es-CO')} COP</span>
                  </div>
                )}

                <div className="border-t border-[#eae5da] pt-3 flex justify-between font-bold text-base text-[#13201a]">
                  <span>Subtotal del paquete</span>
                  <span>${costs.subtotal.toLocaleString('es-CO')} COP</span>
                </div>

                <div className="bg-[#dceb6b] p-4 rounded-2xl flex items-center justify-between text-[#13201a] mt-2">
                  <div>
                    <span className="text-xs uppercase font-extrabold block">Anticipo Requerido Hoy (50%)</span>
                    <span className="text-2xl font-black font-['Unbounded:Black']">
                      ${costs.depositRequired.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="text-right text-xs max-w-[200px]">
                    El saldo de ${costs.remainingBalance.toLocaleString('es-CO')} COP se cancela el día del recorrido.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#eae5da]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold text-[#5e6c64] hover:text-[#13201a] transition-colors cursor-pointer border border-[#e2dcd0]"
              >
                ← Volver a editar datos
              </button>

              <button
                type="button"
                onClick={() => navigate('/pago')}
                className="w-full sm:w-auto bg-[#13201a] hover:bg-black active:scale-95 text-[#dceb6b] font-['Outfit:Bold'] font-bold text-base px-10 py-4 rounded-full flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer"
              >
                <span>Proceder al pago seguro</span>
                <ArrowUpRight className="size-5" />
              </button>
            </div>

          </div>
        </main>
      )}

    </div>
  );
};

export default BookingPage;
