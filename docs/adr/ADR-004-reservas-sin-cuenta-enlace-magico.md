# ADR-004 — Reservas sin cuenta con enlace mágico

- **Estado:** aceptada (2026-10-15)
- **Fecha:** 2026-10-13
- **Decisores:** Juan David Galindo Calderón, Gonzalo Alberto Ayala Almeciga

## Contexto

El turista reserva una o dos veces al año. Pedirle que cree una cuenta con contraseña agrega fricción al momento de pagar y obliga al sistema a custodiar credenciales que casi nunca se vuelven a usar. Hoy el backend exige un JWT con rol `TURISTA` para crear y consultar reservas (`/api/v1/reservas`).

El personal (administrativo, guía y gerencia) sí trabaja a diario con el sistema y necesita una sesión con permisos por rol.

## Decisión

1. **El turista no se registra.** Reserva como invitado con nombre, documento, correo y celular.
2. **Gestiona la reserva con un enlace mágico:** al crearla, el sistema envía al correo un enlace con un token aleatorio de un solo uso y vida corta. Abrir el enlace da acceso a esa reserva (pagar, registrar acompañantes, descargar el comprobante, cancelar). Si el enlace caduca, el turista pide uno nuevo con el código de la reserva y su correo.
3. **El personal inicia sesión** con correo y contraseña. Gerencia crea las cuentas; no hay registro público. El rol de la cuenta decide el panel: administrativo, guía o gerencia.

## Consecuencias

- **Backend:** el registro público de turistas (`/api/v1/auth/registro`) se retira; se agregan endpoints de reserva para invitados, de solicitud de enlace y de intercambio de token, con el token guardado como hash y con límite de intentos por correo y código.
- **Frontend:** la interfaz depende de puertos (`services/puertos.ts`) con dos adaptadores: en memoria, para desarrollo y pruebas, y HTTP, contra la API. Mientras el backend implementa esta decisión, el adaptador HTTP responde con un error explícito en las operaciones de reserva.
- **Seguridad:** quien tenga acceso al correo del titular puede gestionar la reserva. Es aceptable para el riesgo del dominio (una caminata) y se mitiga con tokens de un solo uso, caducidad corta y aviso por correo ante cada cambio.
- **Datos personales:** se piden solo los datos que exige el parque y se informan en la política de tratamiento (Ley 1581 de 2012).
