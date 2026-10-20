# Política de seguridad

## Versiones con soporte

NativaTrips está en desarrollo. Solo la rama `main` y la última etiqueta publicada reciben
correcciones de seguridad.

| Versión            | Soporte |
| ------------------ | ------- |
| `main`             | Sí      |
| Última `v0.N.0`    | Sí      |
| Anteriores         | No      |

## Cómo reportar una vulnerabilidad

**No abras una incidencia pública.** Usa el reporte privado de GitHub:
[Reportar una vulnerabilidad](https://github.com/ggalindov/nativatrips/security/advisories/new).

Si no puedes usarlo, escribe a jdgalindoc@unbosque.edu.co con el asunto
«Seguridad NativaTrips». Incluye:

- Qué componente se ve afectado (API, frontend, configuración, dependencia).
- Pasos para reproducirlo y el impacto que observaste.
- Si es posible, una prueba de concepto mínima, sin datos personales reales.

## Qué esperar

- Acuse de recibo en un máximo de 3 días hábiles.
- Evaluación y plan de corrección en un máximo de 10 días hábiles.
- Aviso cuando la corrección esté publicada y, si lo deseas, reconocimiento en el CHANGELOG.

## Alcance

Dentro del alcance: el código de este repositorio y su configuración por defecto.
Fuera del alcance: servicios de terceros (pasarela de pagos, proveedores de correo y mensajería),
ataques de denegación de servicio y pruebas sobre el entorno de producción de Eco Palacio sin
autorización escrita.

## Controles del repositorio

- Escaneo de secretos con gitleaks sobre todo el historial en cada PR.
- Revisión de dependencias vulnerables y actualizaciones de Dependabot.
- Análisis estático con CodeQL para Java y TypeScript.
- Un modelo de amenazas por sprint en [`docs/seguridad/`](docs/seguridad/).
