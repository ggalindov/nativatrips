# ADR-008 — Capacidad de carga por día y por sendero, con bloqueo al reservar

- **Estado:** aceptada
- **Fecha:** 2026-10-20
- **Decisores:** Juan David Galindo Calderón, Gonzalo Alberto Ayala Almeciga

## Contexto

Hoy la capacidad se configura por **temporada** (`limites_capacidad`: un cupo máximo por día que
vale para un rango de fechas). En la operación de Eco Palacio la capacidad cambia día a día según
el clima, el estado de los senderos y las indicaciones del parque: el administrador la define
semana por semana.

Además, la validación de aforo actual lee la ocupación, la compara y guarda la reserva sin
bloqueo. Dos reservas simultáneas pueden leer la misma ocupación y ambas pasar, vendiendo por
encima del cupo (BUG-01, NAT-121).

## Decisión

1. **La capacidad se carga por día y por sendero** (`capacidad_dia`: sendero, fecha, cupo
   máximo, umbral de alerta y quién la cargó). Un solo registro por sendero y fecha.
2. **La semana de operación va de lunes a domingo.** El administrador carga la capacidad de una
   semana a más tardar el lunes de la semana anterior; el panel le muestra qué días faltan.
3. **Reserva oficial (con apartado y pago) solo para la semana en curso o la siguiente, y solo si
   el día tiene capacidad cargada.** Para fechas posteriores el turista deja una solicitud sin
   cobro (Sprint 4, NAT-113).
4. **El cupo de un día no puede quedar por debajo de lo ya reservado.** Si el administrador lo
   baja, el sistema rechaza el cambio y muestra la ocupación actual.
5. **Al reservar se bloquea la fila de capacidad del día** (`SELECT … FOR UPDATE`) dentro de la
   misma transacción que calcula la ocupación y guarda la reserva. La segunda reserva simultánea
   espera a que termine la primera y ve la ocupación ya actualizada.
6. La tabla por temporada se retira con su propia migración cuando la carga por día esté en uso.

## Consecuencias

- Las reservas del mismo sendero y día se procesan una tras otra. Con el volumen esperado
  (decenas al día) la espera es de milisegundos; reservas de otros senderos o días no se afectan.
- Se necesita una prueba de concurrencia con base de datos real (Testcontainers) que demuestre
  el error antes del arreglo y lo proteja después.
- Sin capacidad cargada no se vende: el panel del administrador avisa de los días que faltan.
- El reporte ambiental (Sprint 5) usa la ocupación real frente a la capacidad de cada día.
