# Cambios

Todos los cambios relevantes de NativaTrips quedan en este archivo. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y las versiones siguen
[versionado semántico](https://semver.org/lang/es/): cada sprint cierra con una versión menor
`v0.N.0-sprintN` y la primera versión en producción será `v1.0.0`.

## [Sin publicar]

Se publica como `v0.3.0-sprint3` en la review del Sprint 3 (23 de octubre de 2026).

### Agregado

- Frontend rediseñado con la identidad de Eco Palacio: portada con el páramo vivo, catálogo y
  ficha de senderos, reserva sin cuenta, «mi reserva» con enlace mágico, asistente Frailín y
  paneles del administrador y del guía (#4).
- Sitio en español, inglés, francés y portugués, con registro de visitantes extranjeros (#4).
- Apartado «cómo llegar» con Waze, Google Maps y el mapa de la reserva (#8).
- Contrato OpenAPI en `/v3/api-docs` y Swagger UI; la CI publica `openapi.json` en cada corrida (#13).
- Plantillas de PR e incidencias y `CODEOWNERS` para la revisión cruzada (#9).
- Escaneo de secretos con gitleaks sobre todo el historial en cada PR (#10).
- Dependabot y revisión de dependencias vulnerables en cada PR (#11).
- Revisión de accesibilidad con axe y Lighthouse (accesibilidad ≥ 95) en la CI (#14).
- Este archivo de cambios (#15).

### Seguridad

- `main` protegida: PR obligatorio con aprobación, CI en verde, historial lineal y sin
  *force push*; alertas de vulnerabilidades de Dependabot activadas.
- `source-map-js` 1.2.2: cierra la alerta alta de denegación de servicio (#24).
- Vite 6.4.4: control de acceso del servidor de desarrollo a los módulos (#33).

### Cambiado

- Sitio liviano para celulares modestos y conexiones lentas: páginas, fotos y video bajo
  demanda, y animaciones que descansan fuera de pantalla (#6, #7, #8).
- Dependabot no propone versiones mayores ni cambios de la versión de Java (#25).
- Frontend: motion 14.4, React 19.3.1, jsdom 30.1.3 y Vitest 5.0.5 (#26).
- Backend: Spring Boot 4.1.1, jjwt 0.13.0, JaCoCo 0.8.15 y Maven 3.10.0 (#27).
- Acciones de GitHub: checkout v7, setup-node v7, setup-java v6, upload-artifact v7 y
  dependency-review v5 (#28).

## [0.2.0] - 2026-10-13

### Agregado

- Prototipo navegable del frontend con Vite, React y Tailwind: inicio, catálogo, ficha,
  reserva, pago simulado y consola administrativa (#3).
- Verificación de tipos y build del frontend en la CI.

## [0.1.0] - 2026-10-13

### Agregado

- Backend en Spring Boot 4 con PostgreSQL 16 y migraciones Flyway.
- Autenticación con JWT y roles.
- Catálogo de senderos y capacidad de carga por sendero y temporada (#1).
- Reservas con máquina de estados, historial auditable y control de aforo.
- Pagos con PayU WebCheckout: firma y confirmación por webhook.
- Asistente conversacional con uso de herramientas.
- CI con compilación, pruebas y cobertura mínima del 70 % en los servicios (JaCoCo) (#2).
- Diagramas de arquitectura.

[Sin publicar]: https://github.com/ggalindov/nativatrips/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ggalindov/nativatrips/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ggalindov/nativatrips/releases/tag/v0.1.0
