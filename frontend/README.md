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

## Portada y video

- **Páramo vivo:** la portada es una ilustración propia en SVG del páramo de Chingaza: oso andino, venado, cóndor, colibrí, pato de páramo y rana con movimiento propio, frailejones que se mecen, niebla y capas con paralaje según el puntero. Un scroll corto (media pantalla) acerca la cámara a la laguna, cae la tarde y avanzan los datos del parque (`src/domain/paramo.ts`). La fauna se mueve aunque el sistema pida movimiento reducido, porque es el contenido de la portada. No usa archivos externos.
- **Video en bucle:** tomas de paisaje del video institucional de Parques Nacionales Naturales de Colombia, sin audio, en `public/media/` (ignorada por git hasta confirmar el permiso de uso). Se genera con:

```bash
scripts/preparar-medios.sh <video-parques-nacionales.mp4>
```

## Biblioteca de fotos y videos

La página `/biblioteca` y el carrusel de la portada se alimentan del servicio `biblioteca` (`src/services/biblioteca/cargarBiblioteca.ts`), que combina:

- **Contenido propio** de Eco Palacio Tur, descrito en `public/biblioteca/biblioteca.json`. Aparece primero.
- **Fotos con licencia libre** de Wikimedia Commons (`src/contenido/fotos.ts`), acreditadas en `/creditos`.

Para cargar el contenido de Instagram de la reserva, quien administra la cuenta descarga la exportación oficial (Instagram → Configuración → Tu actividad → Descargar tu información → Contenido), la descomprime y ejecuta (requiere ffmpeg):

```bash
scripts/importar-biblioteca.sh <carpeta-exportada> [Paisaje|Flora|Fauna|Experiencias]
```

El script genera fotos WebP (1600 y 720 px, sin metadatos), videos H.264 de 720 px sin audio con póster, y el catálogo. Después conviene revisar en `biblioteca.json` los textos alternativos y las categorías de cada elemento.

## Idiomas

El sitio público está en español, inglés, francés y portugués (`src/i18n/`). El selector está en la barra, en el menú móvil y en el pie; la elección se guarda en el navegador y, la primera vez, se toma el idioma del navegador.

- Los textos viven en `src/i18n/diccionarios/`. `es.ts` es la fuente y los demás deben tener exactamente la misma forma: si falta una frase, TypeScript no compila.
- Fechas, números y precios (siempre en pesos colombianos) usan el formato de cada idioma (`src/i18n/formato.ts`).
- Las descripciones de los senderos y los textos alternativos de las fotos también están traducidos. Los nombres propios (senderos, puntos de encuentro) no se traducen.
- El área del equipo (`/equipo`) trabaja siempre en español.

## Visitantes extranjeros

Cada visitante (titular y acompañantes) registra su procedencia. Para extranjeros se elige el país y se ofrecen solo documentos válidos: pasaporte, cédula de extranjería, Permiso por Protección Temporal (PPT) o documento nacional de identidad. El celular lleva indicativo internacional y se valida según el país. Se muestra un aviso sobre el documento en la entrada y la tarifa diferenciada de Parques Nacionales para extranjeros no residentes.

Pendiente en el backend: `IntegranteRequest` solo guarda `nombreCompleto` y `documentoIdentidad`; hay que agregar `tipoDocumento`, `nacionalidad` (ISO 3166-1 alfa-2) y, para el titular, el indicativo del celular.

## Asistente Frailín

Frailín, un frailejón con carita, es el asistente del sitio público (`src/features/asistente/`): lanzador flotante, invitación una vez por sesión, panel de chat (pantalla completa en celular), preguntas sugeridas, indicador de escritura y opción de hablar con una persona. Por ahora es solo la interfaz y responde con un mensaje de demostración; falta conectarlo con `POST /api/v1/asistente/mensajes`, que hoy exige sesión de turista.

## Paneles del personal

Solo interfaz, con datos de ejemplo (`src/features/equipo/ejemplo.ts`); falta conectar los servicios del backend.

| Rol | Pantallas |
| --- | --- |
| Personal administrativo | Hoy · Reservas (filtros, detalle con visitantes, pagos e historial) · Salidas y guías · Capacidad por temporada y alertas al 80 % · Catálogo de senderos · Conversaciones derivadas del chat · Reporte ambiental (PDF/CSV) · Reglas de recomendación |
| Guía (celular) | Lista del grupo con país, visitas y requerimientos especiales · Novedades · Cierre del tour con encuesta · Agenda de 7 días |
| Gerencia | Tablero con ingresos, conversión, NPS, ocupación y procedencia · Reporte ambiental · Capacidad · Cuentas del equipo |

Todos los roles pueden recuperar la contraseña desde el acceso.

## Pendientes

- Validar con el operador las tarifas, sectores, altitudes, desniveles, textos y puntos de encuentro de cada sendero (vienen del prototipo de Figma).
- Endpoints del ADR-004 en el backend para pasar de `mock` a `http`.
