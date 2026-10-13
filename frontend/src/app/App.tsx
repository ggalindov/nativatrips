import { useEffect, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider, crearServicios } from '@/services/ServiciosContext';
import { LandingPage } from '@/features/landing/LandingPage';
import { MiReservaPage } from '@/features/mi-reserva/MiReservaPage';
import { SolicitarEnlacePage } from '@/features/mi-reserva/SolicitarEnlacePage';
import { ReservaApartadaPage } from '@/features/reservas/ReservaApartadaPage';
import { ReservaPage } from '@/features/reservas/ReservaPage';
import { SitioLayout } from '@/features/sitio/SitioLayout';

/** Vuelve arriba al cambiar de página, salvo que la URL apunte a una sección. */
function ScrollAlCambiar() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function Rutas() {
  return (
    <Routes>
      <Route element={<SitioLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="reservar" element={<ReservaPage />} />
        <Route path="reservar/:senderoId" element={<ReservaPage />} />
        <Route path="reserva/apartada" element={<ReservaApartadaPage />} />
        <Route path="mi-reserva" element={<SolicitarEnlacePage />} />
        <Route path="mi-reserva/:token" element={<MiReservaPage />} />
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App({ servicios }: { servicios?: Servicios }) {
  const instancia = useMemo(() => servicios ?? crearServicios(), [servicios]);
  return (
    <ServiciosProvider servicios={instancia}>
      <BrowserRouter>
        <ScrollAlCambiar />
        <Rutas />
      </BrowserRouter>
    </ServiciosProvider>
  );
}
