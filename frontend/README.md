# NativaTrips — Frontend

Sitio público y paneles del equipo de NativaTrips, con la identidad visual de los diseños de Figma del equipo: verde bosque, lima pistacho y arena cálida, con Outfit, Inter y Unbounded.

## Stack

- React 19 + TypeScript (modo estricto)
- Vite 6 y Tailwind CSS 4, con los tokens de la marca en `src/styles/tokens.css`
- React Router 7
- Vitest + Testing Library
- Fuentes autoalojadas con Fontsource
- Motion para animaciones: aparición al hacer scroll, fundidos de fotos, contadores y transiciones; respeta la preferencia de movimiento reducido del sistema

## Arquitectura

```
src/
  domain/     Reglas puras sin React: descenso, aforo, reserva, fechas, roles
  services/   Puertos (interfaces) y adaptadores: en memoria y HTTP
  contenido/  Fotografías y sus créditos
  ui/         Componentes de la marca y de animación
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
| `/` | Público | Portada con descenso fotográfico por scroll, cifras, senderos destacados, guía de visita, reserva rápida y galería |
| `/senderos` y `/senderos/:id` | Público | Catálogo con búsqueda y filtros, y ficha con galería, cifras y agenda de cupos |
| `/antes-de-subir` | Público | Equipaje interactivo, simulador de temperatura por altitud, soroche y normas |
| `/biblioteca` | Público | Fotos y videos del páramo con filtros y visor; alimenta el carrusel de la portada |
| `/creditos` | Público | Autor y licencia de cada fotografía |
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

## Fotografías

Las fotos de `public/fotos/` son fotografías reales del PNN Chingaza publicadas en Wikimedia Commons con licencias CC BY y CC BY-SA. Están redimensionadas a WebP, sin alterar su contenido, y cada una se acredita en `/creditos` (datos en `src/contenido/fotos.ts`). Ilustran el parque; lo ideal es reemplazarlas por fotos propias de cada sendero que entregue el operador.

## Videos de la portada

La portada usa dos medios que **no están en el repositorio** (carpeta `public/media/`, ignorada por git):

- **Descenso por scroll:** un video panorámico del páramo convertido en cuadros WebP a 120 fps (interpolados desde 60 fps, sin las franjas negras). Al hacer scroll, un canvas pinta el cuadro que corresponde a la posición; los cuadros se descargan por refinamiento progresivo y la pantalla de carga muestra el avance.
- **Video en bucle:** tomas de paisaje del video institucional de Parques Nacionales Naturales de Colombia, sin audio.

Para generarlos (requiere ffmpeg):

```bash
scripts/preparar-medios.sh <video-360.mp4> <video-parques-nacionales.mp4>
```

Antes de versionarlos o publicarlos hay que confirmar el permiso de uso de ambos videos.

## Biblioteca de fotos y videos

La página `/biblioteca` y el carrusel de la portada se alimentan del servicio `biblioteca` (`src/services/biblioteca/cargarBiblioteca.ts`), que combina:

- **Contenido propio** de Eco Palacio Tur, descrito en `public/biblioteca/biblioteca.json`. Aparece primero.
- **Fotos con licencia libre** de Wikimedia Commons (`src/contenido/fotos.ts`), acreditadas en `/creditos`.

Para cargar el contenido de Instagram de la reserva, quien administra la cuenta descarga la exportación oficial (Instagram → Configuración → Tu actividad → Descargar tu información → Contenido), la descomprime y ejecuta (requiere ffmpeg):

```bash
scripts/importar-biblioteca.sh <carpeta-exportada> [Paisaje|Flora|Fauna|Experiencias]
```

El script genera fotos WebP (1600 y 720 px, sin metadatos), videos H.264 de 720 px sin audio con póster, y el catálogo. Después conviene revisar en `biblioteca.json` los textos alternativos y las categorías de cada elemento.

## Pendientes

- Validar con el operador las tarifas, sectores, altitudes, desniveles, textos y puntos de encuentro de cada sendero (vienen del prototipo de Figma).
- Endpoints del ADR-004 en el backend para pasar de `mock` a `http`.
