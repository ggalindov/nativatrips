import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRAILS_DATA, Trail } from '../data/trailsData';

export interface Visitor {
  name: string;
  doc: string;
}

export interface BookingState {
  trailId: string;
  trailName: string;
  trailSector: string;
  trailDate: string;
  trailImage: string;
  meetingPoint: string;
  duration: string;
  difficulty: string;
  availableSlots: number;
  leadVisitor: {
    fullName: string;
    email: string;
    phone: string;
    docNumber: string;
  };
  memberCount: number;
  additionalMembers: Visitor[];
  needTransport: boolean;
  needLunch: boolean;
  specialRequirements: string;
  trailPricePerPerson: number;
  transportPricePerPerson: number;
  lunchPricePerPerson: number;
  selectedGateway: 'payu' | 'wompi';
  paymentSubMethod: 'credit_card' | 'pse' | 'cash' | 'nequi' | 'bancolombia';
  bookingCode: string;
  paymentStatus: 'checkout' | 'processing' | 'declined' | 'approved';
  paymentAttemptCount: number;
}

const defaultBookingState: BookingState = {
  trailId: 'lagunas-de-siecha',
  trailName: 'Sendero Lagunas de Siecha',
  trailSector: 'Sector Siecha · PNN Chingaza',
  trailDate: 'Sábado 14 Dic 2025, 6:00 AM',
  trailImage: '/assets/2a205.png',
  meetingPoint: 'Parqueadero Monterredondo, Sector Siecha',
  duration: '5 Horas',
  difficulty: 'Moderado',
  availableSlots: 6,
  leadVisitor: {
    fullName: 'Juan Sebastián Mora',
    email: 'juan.mora@example.com',
    phone: '+57 312 456 7890',
    docNumber: 'C.C. 1.018.452.339',
  },
  memberCount: 3,
  additionalMembers: [
    { name: 'María Camila Restrepo', doc: 'C.C. 1.032.489.112' },
    { name: 'Mateo Mora Restrepo', doc: 'T.I. 1.109.845.221' },
  ],
  needTransport: true,
  needLunch: true,
  specialRequirements: 'Integrante con asma leve. Botiquín adicional solicitado.',
  trailPricePerPerson: 185000,
  transportPricePerPerson: 45000,
  lunchPricePerPerson: 25000,
  selectedGateway: 'payu',
  paymentSubMethod: 'credit_card',
  bookingCode: 'NT-2025-SIECHA-4729',
  paymentStatus: 'checkout',
  paymentAttemptCount: 0,
};

interface BookingContextType {
  state: BookingState;
  selectTrailById: (id: string, preferredDate?: string) => void;
  setTrailDate: (date: string) => void;
  setMemberCount: (count: number) => void;
  updateLeadVisitor: (data: Partial<BookingState['leadVisitor']>) => void;
  updateAdditionalMember: (index: number, data: Partial<Visitor>) => void;
  setNeedTransport: (need: boolean) => void;
  setNeedLunch: (need: boolean) => void;
  setSpecialRequirements: (req: string) => void;
  setSelectedGateway: (gateway: 'payu' | 'wompi') => void;
  setPaymentSubMethod: (method: BookingState['paymentSubMethod']) => void;
  setPaymentStatus: (status: BookingState['paymentStatus']) => void;
  incrementPaymentAttempt: () => void;
  resetBooking: () => void;
  calculateCosts: () => {
    trailTotal: number;
    transportTotal: number;
    lunchTotal: number;
    subtotal: number;
    depositRequired: number;
    remainingBalance: number;
  };
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingState>(() => {
    try {
      const saved = sessionStorage.getItem('nativatrips_booking');
      return saved ? JSON.parse(saved) : defaultBookingState;
    } catch {
      return defaultBookingState;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('nativatrips_booking', JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }, [state]);

  const selectTrailById = (id: string, preferredDate?: string) => {
    const trail = TRAILS_DATA.find((t) => t.id === id) || TRAILS_DATA[0];
    const chosenDate = preferredDate || trail.availableDates[0]?.display || 'Sábado 14 Dic 2025, 6:00 AM';
    const slots = trail.availableDates[0]?.slots || 6;
    const code = `NT-2025-${trail.id.toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    setState((prev) => ({
      ...prev,
      trailId: trail.id,
      trailName: trail.name,
      trailSector: trail.sector,
      trailDate: chosenDate,
      trailImage: trail.image,
      meetingPoint: trail.meetingPoint,
      duration: trail.duration,
      difficulty: trail.difficulty,
      availableSlots: slots,
      trailPricePerPerson: trail.pricePerPerson,
      bookingCode: code,
      paymentStatus: 'checkout',
      paymentAttemptCount: 0,
    }));
  };

  const setTrailDate = (date: string) => {
    setState((prev) => ({ ...prev, trailDate: date }));
  };

  const setMemberCount = (count: number) => {
    const validCount = Math.max(1, Math.min(8, count));
    setState((prev) => {
      const extraNeeded = validCount - 1;
      const currentExtras = [...prev.additionalMembers];
      while (currentExtras.length < extraNeeded) {
        currentExtras.push({ name: '', doc: '' });
      }
      return {
        ...prev,
        memberCount: validCount,
        additionalMembers: currentExtras.slice(0, extraNeeded),
      };
    });
  };

  const updateLeadVisitor = (data: Partial<BookingState['leadVisitor']>) => {
    setState((prev) => ({
      ...prev,
      leadVisitor: { ...prev.leadVisitor, ...data },
    }));
  };

  const updateAdditionalMember = (index: number, data: Partial<Visitor>) => {
    setState((prev) => {
      const updated = [...prev.additionalMembers];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], ...data };
      }
      return { ...prev, additionalMembers: updated };
    });
  };

  const setNeedTransport = (need: boolean) => {
    setState((prev) => ({ ...prev, needTransport: need }));
  };

  const setNeedLunch = (need: boolean) => {
    setState((prev) => ({ ...prev, needLunch: need }));
  };

  const setSpecialRequirements = (req: string) => {
    setState((prev) => ({ ...prev, specialRequirements: req }));
  };

  const setSelectedGateway = (gateway: 'payu' | 'wompi') => {
    setState((prev) => ({
      ...prev,
      selectedGateway: gateway,
      paymentSubMethod: gateway === 'payu' ? 'credit_card' : 'nequi',
    }));
  };

  const setPaymentSubMethod = (method: BookingState['paymentSubMethod']) => {
    setState((prev) => ({ ...prev, paymentSubMethod: method }));
  };

  const setPaymentStatus = (status: BookingState['paymentStatus']) => {
    setState((prev) => ({ ...prev, paymentStatus: status }));
  };

  const incrementPaymentAttempt = () => {
    setState((prev) => ({ ...prev, paymentAttemptCount: prev.paymentAttemptCount + 1 }));
  };

  const resetBooking = () => {
    setState(defaultBookingState);
  };

  const calculateCosts = () => {
    const trailTotal = state.memberCount * state.trailPricePerPerson;
    const transportTotal = state.needTransport ? state.memberCount * state.transportPricePerPerson : 0;
    const lunchTotal = state.needLunch ? state.memberCount * state.lunchPricePerPerson : 0;
    const subtotal = trailTotal + transportTotal + lunchTotal;
    const depositRequired = Math.round(subtotal * 0.5);
    const remainingBalance = subtotal - depositRequired;
    return {
      trailTotal,
      transportTotal,
      lunchTotal,
      subtotal,
      depositRequired,
      remainingBalance,
    };
  };

  return (
    <BookingContext.Provider
      value={{
        state,
        selectTrailById,
        setTrailDate,
        setMemberCount,
        updateLeadVisitor,
        updateAdditionalMember,
        setNeedTransport,
        setNeedLunch,
        setSpecialRequirements,
        setSelectedGateway,
        setPaymentSubMethod,
        setPaymentStatus,
        incrementPaymentAttempt,
        resetBooking,
        calculateCosts,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
