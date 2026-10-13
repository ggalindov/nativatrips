# NativaTrips — Frontend (prototipo v1)

Prototipo navegable de la interfaz pública de NativaTrips, construido a partir de los diseños de Figma del equipo (inicio, senderos, detalle de sendero, reserva, pago, confirmación e información pre-tour).

> **Estado:** prototipo de alta fidelidad con datos simulados. Todavía no consume la API del backend y las imágenes son marcadores de posición; la versión siguiente rediseña la identidad visual e integra la API.

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- React Router 7

## Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/` | `HomePage` | Portada, senderos destacados, guía de visita y reserva rápida |
| `/senderos` | `TrailsPage` | Catálogo de los 13 senderos con filtros por fecha y dificultad |
| `/senderos/:id` | `TrailDetailPage` | Ficha del sendero: galería, especificaciones y calendario |
| `/reservas` | `BookingPage` | Reserva en dos pasos: grupo y adicionales, resumen de costo |
| `/pago` | `PaymentPage` | Resumen de pago con estados simulados de la pasarela |
| `/confirmacion` | `BookingConfirmationPage` | Comprobante con código de reserva |
| `/pre-tour` | `PreTourInfoPage` | Lista de equipaje, normas ambientales y aclimatación |
| `/admin` | `AdminCRMPage` | Consola administrativa (prototipo) |

## Desarrollo

```bash
cd frontend
npm ci
npm run dev        # http://localhost:3000
npm run build      # verificación de tipos + build de producción
npm run preview
```
