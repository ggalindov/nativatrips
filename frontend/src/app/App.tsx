import { useEffect, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider, crearServicios } from '@/services/ServiciosContext';
import { LandingPage } from '@/features/landing/LandingPage';
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
