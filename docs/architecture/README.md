# Diagramas de arquitectura — NativaTrips

Fase de diseño del sistema (épica **NAT-3**). Todos los archivos son `.drawio`
editables con [draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases)
o en [app.diagrams.net](https://app.diagrams.net).

## Cómo trabajarlos

1. Abrir el archivo en draw.io.
2. Editar arrastrando (rejilla y *snap* activados).
3. `Archivo → Exportar como → SVG` (zoom 100 %, borde 10 px, fondo transparente)
   para pegar en el documento de grado (DT).
4. Guardar el `.drawio` y versionarlo por PR.

Mantener el **mismo estilo** en todos: ver `00-leyenda-y-estilo.drawio`.

## Índice

| Archivo | Diagrama | Tarea Jira |
|---|---|---|
| `00-TODOS-los-diagramas.drawio` | **Todos los diagramas en un solo archivo** (una pestaña por diagrama) | — |
| `00-leyenda-y-estilo.drawio` | Leyenda de notación y paleta de color | — |
| `01-c4-1-contexto.drawio` | C4 nivel 1 · Contexto del sistema | NAT-30 |
| `02-c4-2-contenedores.drawio` | C4 nivel 2 · Contenedores | NAT-30 |
| `03-c4-3-componentes-reservas.drawio` | C4 nivel 3 · Componentes del módulo Reservas | NAT-30 / NAT-34 |
| `04-c4-3-componentes-pagos.drawio` | C4 nivel 3 · Componentes del módulo Pagos | NAT-30 / NAT-34 |
| `05-c4-3-componentes-asistente.drawio` | C4 nivel 3 · Componentes del módulo Asistente | NAT-30 / NAT-34 |
| `06-modelo-entidad-relacion.drawio` | Modelo entidad-relación | NAT-31 |
| `07-modulos-monolito-modular.drawio` | Módulos del monolito y dependencias permitidas | NAT-30 |
| `08-clases-reservas.drawio` | Diagrama de clases · Reservas | NAT-32 |
| `09-clases-pagos.drawio` | Diagrama de clases · Pagos | NAT-32 |
| `10-secuencia-autenticacion-jwt.drawio` | Secuencia · Autenticación con JWT | NAT-33 / NAT-37 |
| `11-secuencia-reserva-y-aforo.drawio` | Secuencia · Reserva y control de aforo | NAT-33 |
| `12-secuencia-pago-payu.drawio` | Secuencia · Pago con PayU y webhook | NAT-33 |
| `13-secuencia-asistente-conversacional.drawio` | Secuencia · Asistente conversacional | NAT-33 |
| `14-estados-reserva.drawio` | Máquina de estados · Reserva | NAT-32 |
| `15-estados-pago.drawio` | Máquina de estados · Pago | NAT-32 |
| `16-despliegue.drawio` | Diagrama de despliegue | NAT-35 |
| `17-casos-de-uso.drawio` | Diagrama de casos de uso (UML) | NAT-33 |
| `18-matriz-permisos.drawio` | Matriz de permisos por rol | NAT-38 |

## Paleta (C4)

| Elemento | Relleno | Borde | Texto |
|---|---|---|---|
| Persona / actor | `#08427B` | `#052E56` | blanco |
| Sistema NativaTrips (en alcance) | `#1168BD` | `#0B4884` | blanco |
| Contenedor | `#4C86C6` | `#2E6295` | blanco |
| Componente / módulo | `#9CC5EC` | `#4E7DA6` | `#0A2540` |
| Modelo de dominio / agregado | `#CBE2F5` | `#4E7DA6` | `#0A2540` |
| Repositorio / persistencia | `#F6E2C4` | `#B07A2B` | `#5A3E11` |
| Enumeración | `#E7E0F3` | `#7B61A8` | `#3E2F5B` |
| Sistema externo | `#9A9AA0` | `#63636A` | blanco |

Convención de flechas: `──▶` llamada síncrona · `╌╌▶` evento de dominio (in-process).
Toda flecha lleva propósito y, entre corchetes, el protocolo/mecanismo.
