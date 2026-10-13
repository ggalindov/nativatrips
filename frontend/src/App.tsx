import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';
import { NavbarGlobal } from './components/NavbarGlobal';
import { FooterGlobal } from './components/FooterGlobal';
import { ScrollToTop } from './components/ScrollToTop';

// Pages
import HomePage from './pages/HomePage';

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
