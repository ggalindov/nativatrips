import { Suspense, useEffect, useMemo } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { Servicios } from '@/services/puertos';
import { ServiciosProvider, crearServicios } from '@/services/ServiciosContext';
import { RutaProtegida } from '@/features/equipo/RutaProtegida';
import { SesionProvider, leerSesionGuardada } from '@/features/equipo/SesionContext';
import { LandingPage } from '@/features/landing/LandingPage';
import { PantallaCarga } from '@/features/sitio/PantallaCarga';
import { SitioLayout } from '@/features/sitio/SitioLayout';
import { IdiomaProvider } from '@/i18n/IdiomaContext';
import { CargandoPagina } from '@/ui/Estados';
import { perezosa } from './perezosa';

/* Cada página se descarga al visitarla; la portada va en el paquete inicial. */
const BibliotecaPage = perezosa(() => import('@/features/biblioteca/BibliotecaPage').then((m) => m.BibliotecaPage));
const AntesDeSubirPage = perezosa(() => import('@/features/antes-de-subir/AntesDeSubirPage').then((m) => m.AntesDeSubirPage));
const AccesoPage = perezosa(() => import('@/features/equipo/AccesoPage').then((m) => m.AccesoPage));
const CapacidadPage = perezosa(() => import('@/features/equipo/CapacidadPage').then((m) => m.CapacidadPage));
const RecuperarPage = perezosa(() => import('@/features/equipo/RecuperarPage').then((m) => m.RecuperarPage));
const ReportesPage = perezosa(() => import('@/features/equipo/ReportesPage').then((m) => m.ReportesPage));
const BibliotecaAdmin = perezosa(() => import('@/features/equipo/admin/BibliotecaAdmin').then((m) => m.BibliotecaAdmin));
const ConversacionesAdmin = perezosa(() => import('@/features/equipo/admin/ConversacionesAdmin').then((m) => m.ConversacionesAdmin));
const HoyAdmin = perezosa(() => import('@/features/equipo/admin/HoyAdmin').then((m) => m.HoyAdmin));
const RecomendacionesAdmin = perezosa(() => import('@/features/equipo/admin/RecomendacionesAdmin').then((m) => m.RecomendacionesAdmin));
const ReservasAdmin = perezosa(() => import('@/features/equipo/admin/ReservasAdmin').then((m) => m.ReservasAdmin));
const ResumenAdmin = perezosa(() => import('@/features/equipo/admin/ResumenAdmin').then((m) => m.ResumenAdmin));
const SalidasAdmin = perezosa(() => import('@/features/equipo/admin/SalidasAdmin').then((m) => m.SalidasAdmin));
const SenderosAdmin = perezosa(() => import('@/features/equipo/admin/SenderosAdmin').then((m) => m.SenderosAdmin));
const UsuariosAdmin = perezosa(() => import('@/features/equipo/admin/UsuariosAdmin').then((m) => m.UsuariosAdmin));
const EquipoLayout = perezosa(() => import('@/features/equipo/EquipoLayout').then((m) => m.EquipoLayout));
const PanelGuia = perezosa(() => import('@/features/equipo/guia/PanelGuia').then((m) => m.PanelGuia));
const MiReservaPage = perezosa(() => import('@/features/mi-reserva/MiReservaPage').then((m) => m.MiReservaPage));
const SolicitarEnlacePage = perezosa(() => import('@/features/mi-reserva/SolicitarEnlacePage').then((m) => m.SolicitarEnlacePage));
const ReservaApartadaPage = perezosa(() => import('@/features/reservas/ReservaApartadaPage').then((m) => m.ReservaApartadaPage));
const ReservaPage = perezosa(() => import('@/features/reservas/ReservaPage').then((m) => m.ReservaPage));
const CatalogoPage = perezosa(() => import('@/features/senderos/CatalogoPage').then((m) => m.CatalogoPage));
const FichaSenderoPage = perezosa(() => import('@/features/senderos/FichaSenderoPage').then((m) => m.FichaSenderoPage));
const CreditosPage = perezosa(() => import('@/features/sitio/CreditosPage').then((m) => m.CreditosPage));

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
      <Suspense fallback={<CargandoPagina />}>
        <Outlet />
      </Suspense>
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

/** El idioma lo fija IdiomaProvider en <html lang>; la sesión del equipo, SesionProvider. */
const OPCIONES_SERVICIOS = {
  idioma: () => document.documentElement.lang || 'es',
  token: () => leerSesionGuardada()?.token ?? null,
};

export function App({ servicios }: { servicios?: Servicios }) {
  const instancia = useMemo(() => servicios ?? crearServicios(OPCIONES_SERVICIOS), [servicios]);
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
