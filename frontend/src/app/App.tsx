import { useEffect, useMemo } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider, crearServicios } from '@/services/ServiciosContext';
import { BibliotecaPage } from '@/features/biblioteca/BibliotecaPage';
import { AntesDeSubirPage } from '@/features/antes-de-subir/AntesDeSubirPage';
import { AccesoPage } from '@/features/equipo/AccesoPage';
import { CapacidadPage } from '@/features/equipo/CapacidadPage';
import { RecuperarPage } from '@/features/equipo/RecuperarPage';
import { ReportesPage } from '@/features/equipo/ReportesPage';
import { BibliotecaAdmin } from '@/features/equipo/admin/BibliotecaAdmin';
import { ConversacionesAdmin } from '@/features/equipo/admin/ConversacionesAdmin';
import { HoyAdmin } from '@/features/equipo/admin/HoyAdmin';
import { RecomendacionesAdmin } from '@/features/equipo/admin/RecomendacionesAdmin';
import { ReservasAdmin } from '@/features/equipo/admin/ReservasAdmin';
import { ResumenAdmin } from '@/features/equipo/admin/ResumenAdmin';
import { SalidasAdmin } from '@/features/equipo/admin/SalidasAdmin';
import { SenderosAdmin } from '@/features/equipo/admin/SenderosAdmin';
import { UsuariosAdmin } from '@/features/equipo/admin/UsuariosAdmin';
import { EquipoLayout } from '@/features/equipo/EquipoLayout';
import { RutaProtegida } from '@/features/equipo/RutaProtegida';
import { SesionProvider } from '@/features/equipo/SesionContext';
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
import { IdiomaProvider } from '@/i18n/IdiomaContext';

/** Vuelve arriba al cambiar de página, salvo que la URL apunte a una sección. */
function ScrollAlCambiar() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/** El área del equipo trabaja siempre en español. */
function AreaEquipo() {
  return (
    <IdiomaProvider inicial="es" fijo>
      <Outlet />
    </IdiomaProvider>
  );
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

      <Route path="equipo" element={<AreaEquipo />}>
        <Route index element={<Navigate to="acceso" replace />} />
        <Route path="acceso" element={<AccesoPage />} />
        <Route path="recuperar" element={<RecuperarPage />} />
        <Route element={<RutaProtegida rol="ADMINISTRADOR" />}>
          <Route element={<EquipoLayout />}>
            <Route path="admin" element={<HoyAdmin />} />
            <Route path="admin/resumen" element={<ResumenAdmin />} />
            <Route path="admin/reservas" element={<ReservasAdmin />} />
            <Route path="admin/salidas" element={<SalidasAdmin />} />
            <Route path="admin/capacidad" element={<CapacidadPage />} />
            <Route path="admin/recorridos" element={<SenderosAdmin />} />
            <Route path="admin/biblioteca" element={<BibliotecaAdmin />} />
            <Route path="admin/usuarios" element={<UsuariosAdmin />} />
            <Route path="admin/conversaciones" element={<ConversacionesAdmin />} />
            <Route path="admin/reportes" element={<ReportesPage />} />
            <Route path="admin/recomendaciones" element={<RecomendacionesAdmin />} />
          </Route>
        </Route>
        {/* Direcciones de cuando administración y gerencia eran paneles separados. */}
        <Route path="administrativo/*" element={<Navigate to="/equipo/admin" replace />} />
        <Route path="gerencia/*" element={<Navigate to="/equipo/admin" replace />} />
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
    <IdiomaProvider>
    <ServiciosProvider servicios={instancia}>
      <SesionProvider>
        <BrowserRouter>
          <PantallaCarga />
          <ScrollAlCambiar />
          <Rutas />
        </BrowserRouter>
      </SesionProvider>
    </ServiciosProvider>
    </IdiomaProvider>
    </MotionConfig>
  );
}
