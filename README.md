# NativaTrips

[![CI](https://github.com/ggalindov/nativatrips/actions/workflows/ci.yml/badge.svg)](https://github.com/ggalindov/nativatrips/actions/workflows/ci.yml)
[![Seguridad](https://github.com/ggalindov/nativatrips/actions/workflows/seguridad.yml/badge.svg)](https://github.com/ggalindov/nativatrips/actions/workflows/seguridad.yml)
[![Accesibilidad](https://github.com/ggalindov/nativatrips/actions/workflows/accesibilidad.yml/badge.svg)](https://github.com/ggalindov/nativatrips/actions/workflows/accesibilidad.yml)
[![CodeQL](https://github.com/ggalindov/nativatrips/actions/workflows/codeql.yml/badge.svg)](https://github.com/ggalindov/nativatrips/actions/workflows/codeql.yml)

Sistema de información web para la gestión centralizada de reservas de turismo sostenible.

---

## 1. Descripción

ECO PALACIO TUR S.A.S. (Ecopalacio Chingaza) opera recorridos de ecoturismo en La Calera, en la
zona del Parque Nacional Natural Chingaza. Hoy recibe las reservas por WhatsApp, teléfono y redes
sociales, las anota a mano y no tiene una forma confiable de saber cuántas personas caben en cada
sendero cada día. Eso produce sobrecupos, pagos difíciles de conciliar y preguntas repetidas que
consumen el tiempo del equipo.

NativaTrips reúne en un solo sitio web, en español, inglés, francés y portugués, el catálogo de
senderos, la reserva sin crear cuenta, el pago en línea, el control de la capacidad de carga por
sendero y día, un asistente conversacional que responde las preguntas frecuentes y los paneles del
administrador y del guía. Está pensado para turistas nacionales y extranjeros y para un equipo
operativo sin perfil técnico.

**Código Proyecto:** DT_2026-02-03
**Periodo académico:** 2026 / segundo semestre (Proyecto de Grado 1)
**Organización beneficiaria:** ECO PALACIO TUR S.A.S.
**Director:** Christian Felipe Duarte Arévalo
**Programa:** Ingeniería de Sistemas, Universidad El Bosque

---

## 2. Integrantes

| Nombre completo                  | Usuario GitHub                                 | Correo institucional        | Rol en el equipo                                         |
| -------------------------------- | ---------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| Juan David Galindo Calderón      | [@ggalindov](https://github.com/ggalindov)     | jdgalindoc@unbosque.edu.co  | Backend, arquitectura, seguridad e integración continua  |
| Gonzalo Alberto Ayala Almeciga   | [@chalo10105](https://github.com/chalo10105)   | gaayala@unbosque.edu.co     | Frontend, experiencia de usuario y pruebas de extremo a extremo |

Cada integrante revisa los cambios del otro antes de que entren a `main`.

---

## 3. Tecnologías y requisitos previos

| Herramienta        | Versión mínima | Notas                                                              |
| ------------------ | -------------- | ------------------------------------------------------------------ |
| Java (Temurin)     | 21 LTS         | El proyecto compila con `release 21`                                |
| Maven              | 3.9            | Incluido como `./mvnw`; no hace falta instalarlo                   |
| Spring Boot        | 4.1.1          | Web, Security, Data JPA, Validation, Actuator                      |
| PostgreSQL         | 16             | Esquema versionado con Flyway                                      |
| Node.js            | 22 LTS         | Con npm 10                                                         |
| React              | 19             | Con TypeScript 5.7, Vite 6 y Tailwind CSS 4                        |
| Docker y Compose   | 24 / v2        | Para la base de datos local y la imagen del backend                |
| Git                | 2.40           |                                                                    |

Servicios externos opcionales en desarrollo: la API de mensajes que usa el asistente
conversacional y la pasarela de pagos en modo sandbox. Sin sus llaves, esas dos funciones
responden 503 con un mensaje claro y el resto del sistema funciona igual.

---

## 4. Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/ggalindov/nativatrips.git
cd nativatrips

# 2. Instalar dependencias
./mvnw -B dependency:go-offline        # backend
npm --prefix frontend ci               # frontend

# 3. Configurar variables de entorno
cp .env.example .env
# editar .env con los valores locales (como mínimo DB_PASSWORD y APP_JWT_SECRET)
```

> **Importante:** el archivo `.env` nunca se sube al repositorio. `.env.example` lista todas las
> variables necesarias, sin valores reales, y se actualiza en el mismo PR que agrega una variable.

`APP_JWT_SECRET` debe tener al menos 32 caracteres. Una forma de generarlo:
`openssl rand -base64 48`.

---

## 5. Cómo ejecutar el proyecto

### 5.1 Todo con Docker

```bash
docker compose up -d --build
```

Levanta cuatro servicios y Flyway crea el esquema al arrancar:

| Servicio   | Dirección                         | Qué es                                                   |
| ---------- | --------------------------------- | -------------------------------------------------------- |
| `frontend` | <http://localhost:3000>           | El sitio, servido por Nginx; reenvía `/api` al backend    |
| `backend`  | <http://localhost:8080>           | La API (Swagger en `/swagger-ui.html`)                   |
| `mailpit`  | <http://localhost:8025>           | Buzón de pruebas: ahí llegan todos los correos del sistema |
| `postgres` | `localhost:5432`                  | PostgreSQL 16 con un volumen persistente                 |

Para enviar correos reales en lugar de atraparlos en Mailpit se definen `MAIL_HOST`, `MAIL_PORT`,
`MAIL_USUARIO`, `MAIL_CLAVE`, `MAIL_SMTP_AUTH=true` y `MAIL_STARTTLS=true` en el `.env`.

### 5.2 Desarrollo

```bash
# Base de datos
docker compose up -d postgres

# Backend (lee las variables del entorno o de .env)
./mvnw spring-boot:run

# Frontend, en otra terminal
npm --prefix frontend run dev
```

- **Frontend:** <http://localhost:3000>
- **API:** <http://localhost:8080/api/v1>
- **Documentación de la API (Swagger UI):** <http://localhost:8080/swagger-ui.html>
- **Contrato OpenAPI:** <http://localhost:8080/v3/api-docs>
- **Salud del servicio:** <http://localhost:8080/actuator/health>

El frontend trabaja por defecto con datos en memoria, útiles para demostraciones sin backend.
Para usar la API real se arranca con `VITE_FUENTE_DATOS=http` y `VITE_API_URL=http://localhost:8080`.

- **Usuarios de prueba (modo en memoria):** `admin@ecopalacio.co` y `guia@ecopalacio.co`, contraseña
  `paramo2026`. Son ficticios y solo existen en el navegador; la base de datos no trae cuentas
  precargadas.

---

## 6. Cómo ejecutar las pruebas

```bash
# Backend: pruebas unitarias y de integración, y umbral de cobertura
./mvnw verify

# Backend: una sola clase de pruebas
./mvnw test -Dtest=ReservaServiceTest

# Backend: reporte de cobertura en target/site/jacoco/index.html
./mvnw verify          # abre target/site/jacoco/index.html

# Frontend: análisis estático, pruebas y compilación de producción
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

- **Calidad estática:** ESLint con TypeScript y las reglas de hooks de React en el frontend (sin advertencias permitidas); CodeQL en ambos.
- **Frameworks de pruebas:** JUnit 5, Mockito, Spring Boot Test y Testcontainers (PostgreSQL real)
  en el backend; Vitest y Testing Library en el frontend.
- **Cobertura:** la CI exige como mínimo el 70 % de líneas en el backend con JaCoCo; el reporte
  de cada corrida queda como artefacto `jacoco-report` en GitHub Actions.
- **Qué se prueba:** reglas de reserva y de aforo, incluida la concurrencia sobre el último cupo;
  capacidad de carga por día; autenticación, bloqueo tras intentos fallidos, revocación de sesión
  y recuperación de contraseña; permisos por rol; asistente conversacional con su límite de uso;
  migraciones de base de datos; y en el frontend el cliente HTTP, la navegación y los flujos de
  reserva. Las pruebas de integración necesitan Docker en ejecución.
- **Qué falta:** pruebas de extremo a extremo con navegador, pruebas de carga y la batería de
  inyección de instrucciones del asistente (ver la sección 11).

En cada PR la CI también revisa secretos (gitleaks), dependencias vulnerables, análisis estático
(CodeQL) y accesibilidad (axe y Lighthouse con un puntaje mínimo de 95).

---

## 7. Estructura del repositorio

```text
nativatrips/
├── src/main/java/com/nativatrips/backend/
│   ├── asistente/        # Asistente conversacional y su límite de uso
│   ├── capacidad/        # Capacidad de carga por sendero y día
│   ├── common/           # Errores, respuestas y utilidades compartidas
│   ├── config/           # Seguridad, propiedades y OpenAPI
│   ├── notificaciones/   # Correos al turista y al equipo
│   ├── pagos/            # Pagos en línea y conciliación
│   ├── reservas/         # Reservas, apartado de cupos e historial de estados
│   ├── senderos/         # Catálogo, ficha técnica y disponibilidad
│   └── usuarios/         # Cuentas, roles y autenticación
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/     # Migraciones Flyway (V1, V2, ...)
├── src/test/             # Pruebas del backend
├── frontend/             # Aplicación web en React y TypeScript
├── docs/
│   ├── adr/              # Registros de decisiones de arquitectura
│   └── seguridad/        # Modelos de amenazas por sprint
├── .github/              # CI, plantillas de PR e incidencias, CODEOWNERS y Dependabot
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── CHANGELOG.md
├── SECURITY.md
├── LICENSE
└── README.md
```

---

## 8. Flujo de trabajo con Git

- Rama `main`: siempre estable y protegida. **No se hace push directo.**
- Ramas de trabajo cortas desde `main`, con la clave de Jira: `NAT-87-capacidad-por-dia`,
  `NAT-122-revocar-token-al-cerrar-sesion`.
- Todo cambio entra a `main` mediante **Pull Request** con la plantilla del repositorio, la
  aprobación del otro integrante y los seis chequeos de la CI en verde. La rama debe estar al día
  con `main` y se borra al fusionar.
- Un PR tiene un solo propósito y, en lo posible, menos de 300 líneas.
- Fusión por *rebase*: el historial de `main` es lineal y conserva cada commit.
- Mensajes de commit en formato [Conventional Commits](https://www.conventionalcommits.org/es/)
  con la clave de Jira al final: `feat(capacidad): carga por dia y sendero NAT-87`,
  `fix(auth): revocar el token al cerrar sesion NAT-122`.
- Cada sprint cierra con una etiqueta `v0.N.0-sprintN` y su entrada en el [CHANGELOG](CHANGELOG.md).

---

## 9. Estado del proyecto y avances

| Entrega                                  | Fecha       | Alcance comprometido                                                                              | Estado      |
| ---------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- | ----------- |
| Análisis y diseño                        | 13/09/2026  | Requerimientos, arquitectura y diagramas                                                           | Completado  |
| Sprints 0 a 2 · `v0.1.0`, `v0.2.0`       | 11/10/2026  | Base técnica, senderos, reservas, autenticación y primera versión de pagos                         | Completado  |
| Fase 0 · cimientos del repositorio       | 19/10/2026  | Protección de `main`, plantillas, OpenAPI, escaneo de secretos, dependencias y accesibilidad en CI | Completado  |
| Sprint 3 · `v0.3.0-sprint3`              | 23/10/2026  | Capacidad por día, aforo protegido contra reservas simultáneas, reserva sin cuenta, roles, seguridad de sesión, asistente para visitantes y portal conectado a la API | En curso    |
| Sprint 4 · `v0.4.0-sprint4`              | 06/11/2026  | Pago total en línea con Wompi, enlace mágico, solicitudes, recomendación, reprogramación, guía y biblioteca | Pendiente   |
| Sprint 5 · `v0.5.0-sprint5`              | 20/11/2026  | Avisos al turista, indicadores, cuentas del equipo, reporte ambiental y despliegue                | Pendiente   |
| Cierre de Proyecto de Grado 1            | 30/11/2026  | Informe de avance                                                                                 | Pendiente   |
| Piloto con Eco Palacio · `v1.0.0`        | 04/04/2027  | Versión en producción y piloto de cuatro semanas                                                   | Pendiente   |

El detalle de cada versión está en el [CHANGELOG](CHANGELOG.md).

---

## 10. Decisiones técnicas relevantes

- **Monolito modular, no microservicios.** Un equipo de dos personas, un solo servidor y un piloto
  corto no justifican la operación de varios servicios; los módulos se separan por paquete y se
  comunican por interfaces.
- **Reserva sin cuenta con enlace mágico** ([ADR-004](docs/adr/ADR-004-reservas-sin-cuenta-enlace-magico.md)).
  El turista no crea usuario ni contraseña: recibe un código y un enlace personal que vence.
- **Roles ADMINISTRADOR y GUIA_TURISTICO** ([ADR-007](docs/adr/ADR-007-roles-administrador-y-guia.md)).
  Solo el equipo de Eco Palacio inicia sesión.
- **Capacidad de carga por sendero y día con bloqueo pesimista**
  ([ADR-008](docs/adr/ADR-008-capacidad-de-carga-por-dia.md)). Dos reservas simultáneas nunca
  pueden quedarse con el mismo último cupo.
- **PostgreSQL con Flyway y `ddl-auto: validate`.** El esquema solo cambia con migraciones
  versionadas y revisadas.
- **Sesión con JWT revocable**, bloqueo de 15 minutos tras cinco intentos fallidos y recuperación
  de contraseña con un enlace de un solo uso que vence en 30 minutos.
- **Contrato OpenAPI generado desde el código** con springdoc, publicado por la CI en cada corrida.

---

## 11. Limitaciones conocidas y trabajo futuro

- El pago en línea con Wompi se integra en el Sprint 4; hasta entonces el flujo de
  pago no está disponible para el turista.
- El asistente conversacional depende de un servicio externo de pago por uso; sin llave
  configurada responde 503.
- El portal todavía usa datos en memoria en algunas vistas mientras se conectan a la API.
- Falta la batería de pruebas de inyección de instrucciones del asistente, las pruebas de
  extremo a extremo y las pruebas de carga.
- Avisos por WhatsApp, panel de indicadores y reporte ambiental quedan para el Sprint 5.
- Trabajo futuro: itinerarios de varios días, CRM de clientes y panel analítico.

---

## 12. Créditos y referencias

- [Spring Boot](https://spring.io/projects/spring-boot), [Spring Security](https://spring.io/projects/spring-security)
  y [springdoc-openapi](https://springdoc.org/).
- [PostgreSQL](https://www.postgresql.org/), [Flyway](https://www.red-gate.com/products/flyway/)
  y [Testcontainers](https://testcontainers.com/).
- [React](https://react.dev/), [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/)
  y [Vitest](https://vitest.dev/).
- [jjwt](https://github.com/jwtk/jjwt) para los tokens de sesión.
- [Documentación de Wompi](https://docs.wompi.co/) para la integración de pagos.
- [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), [Conventional Commits](https://www.conventionalcommits.org/es/)
  y [C4 model](https://c4model.com/) para la documentación de arquitectura.
- Fotografías y textos de los senderos: ECO PALACIO TUR S.A.S.

---

## 13. Licencia

Software propietario. © 2026 Juan David Galindo Calderón y Gonzalo Alberto Ayala Almeciga.
Todos los derechos reservados — ver el archivo [LICENSE](LICENSE).
