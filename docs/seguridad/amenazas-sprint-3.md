# Modelo de amenazas · Sprint 3 · Asistente y portal

- **Fecha:** 20 de octubre de 2026
- **Alcance:** lo que se construye en el Sprint 3: reserva sin cuenta con apartado del cupo,
  capacidad de carga por día, aforo con bloqueo, sesión del equipo (bloqueo por intentos y
  revocación del token), asistente para visitantes y frontend conectado a la API.
- **Método:** STRIDE por componente. Cada amenaza tiene un control, el PR que lo implementa y
  su estado. Los estados se actualizan en el informe del sprint.

## Activos

| Activo                          | Por qué importa                                                         |
| ------------------------------- | ----------------------------------------------------------------------- |
| Cupo del día por sendero        | Venderlo por encima de la capacidad de carga daña el páramo (RNF de aforo) |
| Datos de los integrantes        | Nombre y documento de identidad: datos personales (Ley 1581 de 2012)    |
| Sesión del equipo (JWT)         | Da acceso al panel del administrador y del guía                         |
| Clave de la API del asistente   | Cada mensaje tiene costo; un abuso se convierte en factura              |
| Contrato de la API (OpenAPI)    | Mapa completo de los endpoints                                          |

## Fronteras de confianza

```
Visitante (navegador) ──HTTPS──▶ Nginx ──▶ API Spring Boot ──▶ PostgreSQL
                                              │
Equipo (navegador) ──HTTPS + JWT──────────────┤
                                              └──HTTPS──▶ API del modelo del asistente
```

Todo lo que llega del navegador es no confiable, incluido lo que el visitante escribe al
asistente.

## Amenazas

| #     | STRIDE                  | Amenaza                                                                                                   | Control                                                                                          | PR / paso       | Estado    |
| ----- | ----------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------- | --------- |
| A-01  | Manipulación            | Dos reservas simultáneas leen la misma ocupación y ambas pasan la validación: se vende por encima del cupo (BUG-01) | Bloqueo de la fila de capacidad (`SELECT … FOR UPDATE`) dentro de la transacción de la reserva   | S3-03, S3-06    | Pendiente |
| A-02  | Denegación de servicio  | Un bot aparta cupos sin pagar hasta llenar el día                                                          | Apartado de 15 minutos con expiración automática; límite de reservas por correo e IP (Sprint 4)  | S3-12, S4-15    | Parcial   |
| A-03  | Divulgación             | Enumerar reservas ajenas cambiando el identificador en la URL                                              | Identificadores UUID; la reserva solo se ve con su enlace mágico (Sprint 4) o con sesión del equipo | S3-12, S4-05 | Parcial   |
| A-04  | Suplantación            | Fuerza bruta sobre el inicio de sesión del equipo                                                          | Bloqueo tras cinco intentos fallidos durante 15 minutos; mensaje de error genérico                | S3-15           | Pendiente |
| A-05  | Suplantación            | Un token robado sigue sirviendo después de cerrar sesión (BUG-02)                                          | Lista de tokens revocados (por `jti`) consultada en cada petición hasta su vencimiento           | S3-14           | Pendiente |
| A-06  | Elevación de privilegios | Un guía usa endpoints del administrador                                                                    | `@PreAuthorize` por rol en cada endpoint; pruebas de controlador con el rol equivocado → 403      | S3-05           | Pendiente |
| A-07  | Manipulación            | Inyección de instrucciones al asistente para que revele datos de reservas o ignore sus reglas              | El asistente solo consulta reservas con un enlace válido; las herramientas validan en el backend, no en el modelo; batería de 20 casos | S3-10, S3-20 | Pendiente |
| A-08  | Denegación de servicio  | Abuso del asistente público que dispara el costo de la API                                                 | Límite de mensajes por visitante y por IP; respuesta amable al superarlo                          | S3-17           | Pendiente |
| A-09  | Divulgación             | El contrato OpenAPI expone todos los endpoints en producción                                               | `SPRINGDOC_ENABLED=false` en producción                                                          | #13, P-03       | Hecho     |
| A-10  | Divulgación             | Mensajes de error con trazas o detalles internos                                                           | `GlobalExceptionHandler` responde con `ApiErrorResponse` sin trazas                               | (existente)     | Hecho     |
| A-11  | Repudio                 | Un cambio de capacidad o de estado de una reserva sin rastro de quién lo hizo                              | Historial de estados de la reserva (append-only) y auditoría de quién carga la capacidad          | S3-07           | Pendiente |
| A-12  | Manipulación            | Fechas o cantidades inválidas en la reserva (fecha pasada, 0 personas, sendero inactivo)                   | Validación con Bean Validation en el DTO y reglas en el servicio, con pruebas                     | S3-12           | Pendiente |

## Riesgos aceptados

- **Correo comprometido del titular:** quien controle el correo del titular puede gestionar su
  reserva con el enlace mágico. Se acepta por el riesgo del dominio (ver ADR-004) y se mitiga con
  enlaces de un solo uso y vida corta (Sprint 4).
- **El bloqueo serializa las reservas del mismo sendero y día.** Con el volumen esperado (decenas
  de reservas diarias) la espera es de milisegundos.

## Revisión al cierre del sprint

En la review (NAT-48) se actualiza la columna «Estado» de cada amenaza con el PR que la cerró.
Ninguna amenaza alta puede quedar «Pendiente» al cerrar el sprint sin una decisión registrada.
