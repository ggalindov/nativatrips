# NativaTrips — Frontend

Sitio público y paneles del equipo de NativaTrips, con la identidad visual de los diseños de Figma del equipo: verde bosque, lima pistacho y arena cálida, con Outfit, Inter y Unbounded.

## Stack

- React 19 + TypeScript (modo estricto)
- Vite 6 y Tailwind CSS 4, con los tokens de la marca en `src/styles/tokens.css`
- React Router 7
- Vitest + Testing Library
- Fuentes autoalojadas con Fontsource

## Arquitectura

```
src/
  domain/     Reglas puras sin React: descenso, aforo, reserva, fechas, roles
  services/   Puertos (interfaces) y adaptadores: en memoria y HTTP
  ui/         Componentes de la marca: logo, botones, campos, estados
  features/   Una carpeta por funcionalidad: landing, reservas, mi-reserva, equipo
  app/        Rutas y proveedores
```

La interfaz solo conoce los puertos de `services/puertos.ts`. La fuente de datos se elige con una variable de entorno:

| `VITE_FUENTE_DATOS` | Uso |
|---|---|
| `mock` (por defecto) | Datos en memoria, para desarrollo y pruebas |
| `http` | API del backend en `VITE_API_URL` (por defecto `http://localhost:8080`) |

## Rutas

| Ruta | Quién | Qué |
|---|---|---|
| `/` | Público | Portada con descenso por scroll y catálogo de senderos |
| `/reservar/:sendero` | Público | Reserva sin cuenta, con cupos por día |
| `/mi-reserva` y `/mi-reserva/:token` | Turista | Pedir el enlace mágico y gestionar la reserva (ADR-004) |
| `/equipo/acceso` | Personal | Inicio de sesión |
| `/equipo/administrativo` | Personal administrativo | Revisión de reservas, salidas del día, aforo |
| `/equipo/guia` | Guía | Lista del grupo y asistencia, pensado para el celular |
| `/equipo/gerencia` | Gerencia | Ocupación, senderos más reservados y alertas |

Con datos en memoria, las cuentas de prueba son `admin@`, `guia@` y `gerencia@ecopalacio.co`, con la contraseña `paramo2026`.

## Desarrollo

```bash
cd frontend
npm ci
npm run dev          # http://localhost:3000
npm test             # pruebas
npm run build        # verificación de tipos + build de producción
```

## Pendientes

- Fotografía y video reales del páramo, con licencia libre y atribución, para la secuencia de la portada.
- Endpoints del ADR-004 en el backend para pasar de `mock` a `http`.
