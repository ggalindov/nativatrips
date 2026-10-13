import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { NavbarGlobal } from './components/NavbarGlobal';
import { FooterGlobal } from './components/FooterGlobal';
import { ScrollToTop } from './components/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';
import TrailsPage from './pages/TrailsPage';
import TrailDetailPage from './pages/TrailDetailPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import PreTourInfoPage from './pages/PreTourInfoPage';
import AdminCRMPage from './pages/AdminCRMPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col w-full bg-[#f5f1e7] text-[#13201a]">
            <NavbarGlobal />
            <main className="flex-1 flex flex-col w-full">
              <Routes>
                {/* 1. Inicio: NativaTrips Landing */}
                <Route path="/" element={<HomePage />} />

                {/* 2. Panel Senderos: Catálogo completo de 13 senderos */}
                <Route path="/senderos" element={<TrailsPage />} />

                {/* 3. Panel Vista Senderos: Detalle del sendero */}
                <Route path="/senderos/:id" element={<TrailDetailPage />} />
                <Route path="/sendero" element={<TrailDetailPage />} />

                {/* 4. Reservas: Flujo directo sin inicio de sesión (Guest Checkout) */}
                <Route path="/reservas" element={<BookingPage />} />

                {/* 5. Proceso Pago: Pasarela PayU / Wompi y simulación de estados */}
                <Route path="/pago" element={<PaymentPage />} />

                {/* 6. Confirmación Reserva: Voucher y pase de abordaje oficial */}
                <Route path="/confirmacion" element={<BookingConfirmationPage />} />

                {/* 7. Información Pre-Tour: Preparación, checklist interactivo y recomendaciones */}
                <Route path="/pre-tour" element={<PreTourInfoPage />} />

                {/* 8. Consola Administrativa, Guías & CRM PNN (Acceso seguro con botón candadito) */}
                <Route path="/admin" element={<AdminCRMPage />} />
                <Route path="/staff" element={<AdminCRMPage />} />
                <Route path="/crm" element={<AdminCRMPage />} />

                {/* Sin inicio de sesión obligatorio: Redirecciones directas a reservas */}
                <Route path="/autenticacion" element={<Navigate to="/reservas" replace />} />
                <Route path="/login" element={<Navigate to="/reservas" replace />} />
                <Route path="/registro" element={<Navigate to="/reservas" replace />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <FooterGlobal />
          </div>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;
