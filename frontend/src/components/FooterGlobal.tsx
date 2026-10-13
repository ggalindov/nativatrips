import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from './Toast';
import {
  Mountain,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  ChevronUp,
  Heart,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Lock
} from 'lucide-react';

export const FooterGlobal: React.FC = () => {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setToastMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }
    setToastMessage('¡Gracias por unirte a la red de guardianes del páramo Chingaza!');
    setEmailInput('');
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="w-full bg-[#0e1c16] border-t border-[#1e312b] text-white pt-16 pb-12 px-6 sm:px-12 lg:px-20 no-print mt-auto relative z-10">
      
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Columna 1: Brand & Mission (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div 
              onClick={() => navigate('/')} 
              className="flex items-center gap-3 cursor-pointer group w-fit"
            >
              <div className="bg-[#dceb6b] size-10 rounded-2xl flex items-center justify-center text-[#13201a] group-hover:scale-105 transition-transform">
                <Mountain className="size-5" />
              </div>
              <span className="font-['Outfit:Black'] font-black text-2xl text-white tracking-tight">
                NativaTrips
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-['Inter:Regular'] max-w-sm">
              Operador ecoturístico comunitario oficial en el Parque Nacional Natural Chingaza. Conectamos viajeros conscientes con la cuna sagrada del agua andina bajo principios estrictos de conservación y turismo regenerativo.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-[#dceb6b] font-bold bg-[#172d24] px-3.5 py-1.5 rounded-full w-fit border border-[#2e4d3e]">
              <ShieldCheck className="size-4 text-[#dceb6b]" />
              <span>RNT #4812 · Aval Parques Nacionales</span>
            </div>
          </div>

          {/* Columna 2: Navegación Rápida (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-['Outfit:Bold'] font-bold uppercase tracking-wider text-[#dceb6b]">
              Exploración
            </span>
            <ul className="flex flex-col gap-2 text-xs text-white/70">
              <li>
                <button onClick={() => navigate('/senderos')} className="hover:text-white transition-colors cursor-pointer">
                  13 Senderos Habilitados
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/senderos/lagunas-de-siecha')} className="hover:text-white transition-colors cursor-pointer">
                  Lagunas de Siecha
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/senderos/las-balsillas')} className="hover:text-white transition-colors cursor-pointer">
                  Las Balsillas
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pre-tour')} className="hover:text-white transition-colors cursor-pointer">
                  Guía Pre-Tour & Clima
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/reservas')} className="hover:text-white transition-colors cursor-pointer">
                  Reservar Cupo
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Normatividad y Soporte (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-['Outfit:Bold'] font-bold uppercase tracking-wider text-[#dceb6b]">
              Seguridad & PNN
            </span>
            <ul className="flex flex-col gap-2 text-xs text-white/70">
              <li>
                <button onClick={() => navigate('/confirmacion')} className="hover:text-white transition-colors cursor-pointer">
                  Consultar Mi Voucher
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pre-tour')} className="hover:text-white transition-colors cursor-pointer">
                  Guía Pre-Tour & Clima
                </button>
              </li>
              <li>
                <a
                  href="https://www.parquesnacionales.gov.co/nuestros-parques/pnn-chingaza/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>Portal Oficial PNN</span>
                  <ExternalLink className="size-3" />
                </a>
              </li>
              <li>
                <span className="text-white/50">Póliza Asistencia Médica Colasistencia</span>
              </li>
              <li>
                <span className="text-white/50">Cero Plásticos de Un Solo Uso</span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Newsletter & Contacto (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <span className="text-xs font-['Outfit:Bold'] font-bold uppercase tracking-wider text-[#dceb6b]">
              Boletín del Páramo
            </span>
            <p className="text-xs text-white/70">
              Recibe avisos sobre floración de frailejones, avistamiento de fauna y apertura de nuevas fechas autorizadas.
            </p>

            <form onSubmit={handleSubscribe} className="flex items-center gap-2">
              <input
                type="email"
                required
                placeholder="tu.correo@ejemplo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-[#172b22] border border-[#2b4438] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#dceb6b] flex-1"
              />
              <button
                type="submit"
                className="bg-[#dceb6b] hover:bg-[#c9d870] active:scale-95 text-[#13201a] p-2.5 rounded-xl font-bold transition-all cursor-pointer shrink-0"
                title="Suscribirme"
              >
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="pt-2 flex flex-col gap-1.5 text-xs text-white/60">
              <a 
                href="https://wa.me/573124567890" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-[#dceb6b] transition-colors flex items-center gap-2"
              >
                <MessageCircle className="size-3.5 text-[#dceb6b]" />
                <span>WhatsApp Soporte: (+57) 312 456-7890</span>
              </a>
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-[#dceb6b]" />
                <span>Sector Piedras Gordas & Siecha · Chingaza, Cundinamarca</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1c3026] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>© 2026 NativaTrips Colombia. Hecho con amor por la alta montaña andina.</span>
            {/* Botón oculto de candadito: Acceso exclusivo para administradores, personal y guías */}
            <button
              onClick={() => navigate('/admin')}
              title="Consola Administrativa & Guías PNN"
              className="opacity-20 hover:opacity-100 hover:text-[#dceb6b] p-1 rounded-md transition-all text-white/40 hover:bg-white/10 cursor-pointer ml-1"
            >
              <Lock className="size-3.5" />
            </button>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 bg-[#172d24] hover:bg-[#203c30] text-white/80 hover:text-white px-3.5 py-1.5 rounded-full border border-[#2b493c] transition-all cursor-pointer"
          >
            <span>Volver arriba</span>
            <ChevronUp className="size-3.5" />
          </button>
        </div>

      </div>

    </footer>
  );
};

export default FooterGlobal;
