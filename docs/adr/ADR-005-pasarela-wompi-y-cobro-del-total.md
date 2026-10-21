# ADR-005 — Pasarela Wompi y cobro del total de la reserva

- **Estado:** aceptada
- **Fecha:** 2026-10-20
- **Decisores:** Juan David Galindo Calderón, Gonzalo Alberto Ayala Almeciga

## Contexto

El módulo `pagos` se construyó contra PayU WebCheckout (firma MD5 y webhook con formulario). Eco
Palacio abrió su cuenta comercial en Wompi, que en Colombia ofrece tarjeta, PSE, Nequi y botón
Bancolombia con una sola integración, y el equipo decidió el 15 de octubre usar Wompi y cobrar el
**100 %** de la reserva en línea (no un anticipo).

Además, el manejo actual del resultado tiene dos problemas:

- el primer rechazo cancela la reserva (BUG-03, NAT-123), aunque HU-03 permite dos reintentos;
- un evento repetido de la pasarela vuelve a procesarse.

## Decisión

1. **Wompi Web Checkout por redirección.** El backend arma la URL del checkout
   (`https://checkout.wompi.co/p/`) con la llave pública, la referencia, el monto en centavos,
   la moneda (`COP`), la URL de regreso y la **firma de integridad**:
   `SHA-256(referencia + montoEnCentavos + moneda + secretoDeIntegridad)`. El navegador va a
   Wompi; el monto no lo decide el frontend.
2. **Se cobra el total:** precio del sendero por el número de personas de la reserva.
3. **El resultado solo se cree si llega firmado.** Wompi envía el evento `transaction.updated` a
   `POST /api/v1/pagos/wompi/eventos`. El backend recalcula el checksum
   `SHA-256(valores de signature.properties en orden + timestamp + secretoDeEventos)` y lo compara
   en tiempo constante; si no coincide, o el monto o la moneda no son los del pago, el evento se
   rechaza y no cambia nada. La URL de regreso del navegador nunca confirma un pago.
4. **Idempotencia:** cada evento se guarda con el id de la transacción y su estado; si llega de
   nuevo el mismo par, se responde 200 sin volver a procesarlo. Un pago ya aprobado no se
   reabre.
5. **Dos reintentos:** un pago rechazado deja la reserva en `PENDIENTE_PAGO` mientras su apartado
   siga vigente; al tercer rechazo la reserva se cancela y el cupo se libera (BUG-03).
6. **Conciliación antes de liberar:** cuando vence el apartado de una reserva con un pago
   pendiente, el backend consulta la transacción en la API de Wompi antes de expirarla, por si
   el evento se perdió (HU-03, criterio 5).
7. **La pasarela queda detrás de una interfaz** (`PasarelaPago`): el servicio de pagos no conoce
   a Wompi. PayU se retira cuando Wompi esté completo, sin dejar `main` sin pagos.
8. **Llaves solo en variables de entorno** del servidor (`WOMPI_LLAVE_PUBLICA`,
   `WOMPI_LLAVE_PRIVADA`, `WOMPI_SECRETO_INTEGRIDAD`, `WOMPI_SECRETO_EVENTOS`): el repositorio es
   público. En desarrollo se usan las llaves del sandbox (`pub_test_…`).

## Consecuencias

- El turista sin cuenta paga desde el enlace mágico de su reserva (HU-18); el pago con sesión de
  turista se retira con PayU.
- Cambia el contrato del pago: el frontend recibe una URL de checkout, no un formulario para
  enviar.
- Se necesita una tabla de eventos recibidos y un contador de intentos por reserva.
- Los diagramas de secuencia y de componentes de pagos se actualizan (S2-18).
- Riesgo: si Wompi tarda en aprobar la cuenta comercial, se sigue en sandbox; producción solo
  cambia las variables de entorno.
