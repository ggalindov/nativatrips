import { useEffect, useMemo } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider, crearServicios } from '@/services/ServiciosContext';
import { BibliotecaPage } from '@/features/biblioteca/BibliotecaPage';
import { AntesDeSubirPage } from '@/features/antes-de-subir/AntesDeSubirPage';
import { AccesoPage } from '@/features/equipo/AccesoPage';
import { EquipoLayout } from '@/features/equipo/EquipoLayout';
import { RutaProtegida } from '@/features/equipo/RutaProtegida';
import { SesionProvider } from '@/features/equipo/SesionContext';
import { PanelAdministrativo } from '@/features/equipo/administrativo/PanelAdministrativo';
import { PanelGerencia } from '@/features/equipo/gerencia/PanelGerencia';
import { PanelGuia } from '@/features/equipo/guia/PanelGuia';
import { LandingPage } from '@/features/landing/LandingPage';
import { MiReservaPage } from '@/features/mi-reserva/MiReservaPage';
import { SolicitarEnlacePage } from '@/features/mi-reserva/SolicitarEnlacePage';
import { ReservaApartadaPage } from '@/features/reservas/ReservaApartadaPage';
import { ReservaPage } from '@/features/reservas/ReservaPage';
import { CatalogoPage } from '@/features/senderos/CatalogoPage';
import { FichaSenderoPage } from '@/features/senderos/FichaSenderoPage';
import { CreditosPage } from '@/features/sitio/CreditosPage';
import { PantallaCarga } from '@/features/sitio/PantallaCarga';
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
        <Route path="senderos" element={<CatalogoPage />} />
        <Route path="senderos/:senderoId" element={<FichaSenderoPage />} />
        <Route path="antes-de-subir" element={<AntesDeSubirPage />} />
        <Route path="biblioteca" element={<BibliotecaPage />} />
        <Route path="creditos" element={<CreditosPage />} />
        <Route path="reservar" element={<ReservaPage />} />
        <Route path="reservar/:senderoId" element={<ReservaPage />} />
        <Route path="reserva/apartada" element={<ReservaApartadaPage />} />
        <Route path="mi-reserva" element={<SolicitarEnlacePage />} />
        <Route path="mi-reserva/:token" element={<MiReservaPage />} />
      </Route>

      <Route path="equipo">
        <Route index element={<Navigate to="acceso" replace />} />
        <Route path="acceso" element={<AccesoPage />} />
        <Route element={<RutaProtegida rol="PERSONAL_ADMINISTRATIVO" />}>
          <Route element={<EquipoLayout rol="PERSONAL_ADMINISTRATIVO" />}>
            <Route path="administrativo" element={<PanelAdministrativo />} />
          </Route>
        </Route>
        <Route element={<RutaProtegida rol="GERENCIA" />}>
          <Route element={<EquipoLayout rol="GERENCIA" />}>
            <Route path="gerencia" element={<PanelGerencia />} />
          </Route>
        </Route>
        <Route element={<RutaProtegida rol="GUIA_TURISTICO" />}>
          <Route path="guia" element={<PanelGuia />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App({ servicios }: { servicios?: Servicios }) {
  const instancia = useMemo(() => servicios ?? crearServicios(), [servicios]);
  return (
    <MotionConfig reducedMotion="user">
    <ServiciosProvider servicios={instancia}>
      <SesionProvider>
        <BrowserRouter>
          <PantallaCarga />
          <ScrollAlCambiar />
          <Rutas />
        </BrowserRouter>
      </SesionProvider>
    </ServiciosProvider>
    </MotionConfig>
  );
}
