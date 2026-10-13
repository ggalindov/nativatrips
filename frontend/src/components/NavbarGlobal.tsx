import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import {
  Mountain,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
  Ticket,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const NavbarGlobal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: bookingState } = useBooking();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active route check helper
  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-[#13201a]/95 backdrop-blur-md border-b border-[#1e312b] sticky top-0 z-40 w-full shrink-0 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="bg-[#dceb6b] size-10 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <Mountain className="size-5 text-[#13201a]" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Outfit:ExtraBold'] font-extrabold text-2xl text-white tracking-tight leading-none group-hover:text-[#dceb6b] transition-colors">
              NativaTrips
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#dceb6b] font-bold mt-0.5 flex items-center gap-1">
              <span>PNN Chingaza</span>
              <span className="size-1 rounded-full bg-[#dceb6b]" />
              <span className="text-white/60">Colombia</span>
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-['Inter:Medium'] font-medium">
          <button
            onClick={() => handleNav('/')}
            className={`transition-colors cursor-pointer ${
              isActive('/') ? 'text-[#dceb6b] font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            Inicio
          </button>

          <button
            onClick={() => handleNav('/senderos')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              isActive('/senderos') ? 'text-[#dceb6b] font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            <span>Senderos</span>
            <span className="text-[10px] bg-[#dceb6b]/20 text-[#dceb6b] font-bold px-2 py-0.5 rounded-full border border-[#dceb6b]/30">
              13
            </span>
          </button>

          <button
            onClick={() => handleNav('/pre-tour')}
            className={`transition-colors cursor-pointer flex items-center gap-1 ${
              isActive('/pre-tour') ? 'text-[#dceb6b] font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            <Sparkles className="size-3.5 text-[#dceb6b]" />
            <span>Guía Pre-Tour</span>
          </button>

          <button
            onClick={() => handleNav('/confirmacion')}
            className={`transition-colors cursor-pointer flex items-center gap-1.5 ${
              isActive('/confirmacion') ? 'text-[#dceb6b] font-bold' : 'text-white/80 hover:text-white'
            }`}
          >
            <Ticket className="size-3.5" />
            <span>Mi Voucher</span>
          </button>
        </nav>

        {/* Right Side Actions (No Login Barrier - Direct Booking & Voucher Status) */}
        <div className="hidden sm:flex items-center gap-3">
          
          {/* Active Booking Capsule (If visitor has an active booking) */}
          {bookingState.bookingCode && (
            <button
              onClick={() => handleNav('/confirmacion')}
              className="flex items-center gap-2 bg-[#1e312b] hover:bg-[#28423a] border border-[#2e4036] px-3.5 py-1.5 rounded-full text-xs text-white/90 cursor-pointer transition-colors shadow-xs"
              title="Ver tu comprobante de reserva oficial"
            >
              <span className="size-2 rounded-full bg-[#dceb6b] animate-ping" />
              <span className="font-semibold text-white truncate max-w-[140px]">
                {bookingState.trailName.replace('Sendero ', '')}
              </span>
              <span className="font-mono text-[#dceb6b] font-bold">
                {bookingState.bookingCode}
              </span>
            </button>
          )}

          {/* Primary CTA */}
          <button
            onClick={() => handleNav('/reservas')}
            className="bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Reservar Visita</span>
            <ArrowUpRight className="size-4" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="size-6 text-[#dceb6b]" /> : <Menu className="size-6" />}
        </button>

      </div>

      {/* Mobile Drawer Menu (No login, pure direct navigation) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#13201a] border-t border-[#1e312b] px-6 py-6 flex flex-col gap-4 animate-slide-down shadow-2xl">
          <button
            onClick={() => handleNav('/')}
            className={`text-left text-base font-bold py-2 border-b border-[#1e312b] ${
              isActive('/') ? 'text-[#dceb6b]' : 'text-white'
            }`}
          >
            Inicio
          </button>

          <button
            onClick={() => handleNav('/senderos')}
            className={`text-left text-base font-bold py-2 border-b border-[#1e312b] flex items-center justify-between ${
              isActive('/senderos') ? 'text-[#dceb6b]' : 'text-white'
            }`}
          >
            <span>Senderos Habilitados</span>
            <span className="text-xs bg-[#dceb6b] text-[#13201a] px-2 py-0.5 rounded-full font-bold">
              13
            </span>
          </button>

          <button
            onClick={() => handleNav('/pre-tour')}
            className={`text-left text-base font-bold py-2 border-b border-[#1e312b] flex items-center gap-2 ${
              isActive('/pre-tour') ? 'text-[#dceb6b]' : 'text-white'
            }`}
          >
            <Sparkles className="size-4 text-[#dceb6b]" />
            <span>Guía Pre-Tour y Checklist</span>
          </button>

          <button
            onClick={() => handleNav('/confirmacion')}
            className={`text-left text-base font-bold py-2 border-b border-[#1e312b] flex items-center gap-2 ${
              isActive('/confirmacion') ? 'text-[#dceb6b]' : 'text-white'
            }`}
          >
            <Ticket className="size-4 text-[#dceb6b]" />
            <span>Mi Pase de Abordaje / Voucher</span>
          </button>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => handleNav('/reservas')}
              className="w-full bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] font-['Outfit:Bold'] font-bold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Reservar Cupo en Sendero</span>
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavbarGlobal;
