# MiMesa — Especificación de requerimientos

Fecha: 2026-09-08
Equipo: 3 personas
Entrega: viernes 2026-09-12
Tipo de proyecto: demo académica, no comercial, sin escalabilidad requerida

## 1. Objetivo

MiMesa es una aplicación web para armar la distribución de mesas de un evento. El organizador crea el evento, elige una plantilla de mesas, carga la lista de invitados y los ubica en las sillas arrastrándolos. Al terminar, genera un link que cada invitado abre para buscar su nombre y ver en qué mesa está y con quién.

El objetivo de la entrega es mostrar cuánto puede avanzar un equipo de tres estudiantes trabajando en paralelo. Se prioriza lo visible y funcional en una demo por sobre la robustez.

## 2. Alcance

### 2.1 Incluido

- Un único evento activo por navegador, guardado automáticamente.
- Mesas redondas únicamente.
- Editor de distribución con drag and drop.
- Vista del invitado accesible por link, sin backend.
- Exportación del plano a imagen PNG.

### 2.2 Excluido

- Backend, base de datos, cuentas de usuario o login.
- Mesas rectangulares o imperiales.
- Grupos o etiquetas de invitados.
- Varios eventos guardados a la vez.
- Importar un evento desde un link compartido.
- Lista imprimible.
- Confirmación de asistencia, deshacer, modo oscuro.
- Tests automatizados.

## 3. Glosario

- **Evento**: nombre, fecha, lugar opcional, mesas e invitados.
- **Mesa**: mesa redonda con nombre, capacidad y posición en el plano. Tiene tantas sillas como capacidad.
- **Silla**: posición numerada dentro de una mesa. Está vacía o tiene un invitado.
- **Invitado**: persona con nombre. Está "sin ubicar" si no ocupa ninguna silla.
- **Panel lateral**: lista de invitados sin ubicar.
- **Plano**: área donde se dibujan las mesas.
- **Vista del invitado**: pantalla que abre quien recibe el link.

## 4. Requerimientos funcionales

Prioridad: **M** = imprescindible para la demo, **S** = incluido, se hace después de los M.
Tamaño estimado: **S** = pocas horas, **M** = alrededor de un día.

### 4.1 Evento

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-01 | Crear un evento con nombre (obligatorio), fecha (obligatoria) y lugar (opcional). | M | S |
| RF-02 | Editar nombre, fecha y lugar del evento en cualquier momento. | M | S |
| RF-03 | "Nuevo evento" borra todo el estado actual, previa confirmación. | M | S |
| RF-41 | La aplicación abre en una pantalla de inicio con el logo, la bajada del producto y un bloque "Tus eventos". Si no hay evento guardado muestra el estado vacío y el botón "Crear evento", que lleva al formulario de creación. Si hay uno, muestra su tarjeta con nombre, fecha, lugar y contadores de mesas, invitados y sentados, con "Abrir plano" y "Eliminar", más "Crear uno nuevo" que avisa que el evento actual se va a borrar. | S | M |

### 4.2 Mesas

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-04 | Al crear el evento se elige una plantilla de mesas: "6 mesas de 8", "10 mesas de 10", "8 mesas de 6" o "Personalizado" (cantidad de mesas y capacidad, ambas numéricas). | M | S |
| RF-05 | Las mesas se numeran automáticamente "Mesa 1", "Mesa 2", etc., y se ubican en grilla en el plano. | M | S |
| RF-06 | Agregar una mesa nueva indicando capacidad, desde un botón "Agregar mesa" siempre visible abajo a la derecha del plano. Eliminar una mesa: sus invitados vuelven al panel lateral. | M | S |
| RF-07 | Cambiar la capacidad de una mesa. Si se reduce y hay invitados en las sillas que desaparecen, vuelven al panel lateral. | S | S |
| RF-08 | Renombrar una mesa con doble click sobre su nombre. | S | S |
| RF-09 | Cada mesa se dibuja como un círculo con las sillas distribuidas alrededor, el nombre en el centro y la ocupación "5/8". | M | M |
| RF-10 | El color de la mesa indica su ocupación: vacía, parcial o completa. | S | S |
| RF-11 | Mover una mesa arrastrándola por el plano. La posición se guarda. | S | M |
| RF-12 | Vaciar una mesa desde su menú: todos sus invitados vuelven al panel lateral. | S | S |
| RF-13 | "Vaciar todas las mesas" desde la barra superior, previa confirmación. | S | S |
| RF-36 | Zoom del plano entre 50 % y 200 % con botones "−", "100 %", "+" abajo a la derecha y con Ctrl + rueda. Es estado de interfaz: no se guarda con el evento y no afecta el PNG. | S | S |
| RF-37 | Click sobre el disco de una mesa la selecciona (borde índigo). La mesa seleccionada tiene un control "Tamaño" −/+ (0,75x a 2x, pasos de 0,25) que agranda o achica el dibujo completo, sillas incluidas, sin cambiar la capacidad. El tamaño se guarda con el evento. Escape o click en el fondo deselecciona. | S | M |

### 4.3 Invitados

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-14 | Carga masiva: un área de texto con un nombre por renglón y un botón "Aceptar". Se ignoran renglones vacíos y se recortan espacios. Se permiten nombres repetidos. | M | S |
| RF-15 | Los invitados creados aparecen en el panel lateral como tarjetas con su nombre. | M | S |
| RF-16 | Agregar un invitado individual desde el panel lateral. | M | S |
| RF-17 | Eliminar un invitado desde el panel lateral o desde su silla. | S | S |
| RF-18 | Buscador en el panel lateral que filtra por texto, sin distinguir mayúsculas ni acentos. | S | S |
| RF-19 | Contadores en la barra superior: invitados totales, sentados, sin ubicar y sillas libres. | S | S |

### 4.4 Ubicación en mesas

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-20 | Arrastrar un invitado del panel lateral y soltarlo sobre una silla vacía lo sienta ahí. | M | M |
| RF-21 | Arrastrar un invitado y soltarlo sobre la mesa (no sobre una silla) lo sienta en la primera silla libre. | M | S |
| RF-22 | Si la mesa o la silla está ocupada, el drop se rechaza con una señal visual y el invitado vuelve a donde estaba. | M | S |
| RF-23 | Arrastrar un invitado ya sentado a otra silla o mesa lo mueve. | S | S |
| RF-24 | Click sobre un invitado sentado abre un menú con "Quitar de la mesa" (vuelve al panel lateral) y "Eliminar invitado". | M | S |
| RF-38 | Arrastrar un invitado ya sentado y soltarlo sobre el panel lateral lo quita de la mesa y lo devuelve a "Sin ubicar". El panel se resalta mientras el invitado está encima. Soltar fuera del panel, sobre el plano vacío, deja al invitado en su silla. | S | S |
| RF-39 | Arrastrar un invitado ya sentado y soltarlo sobre una silla ocupada intercambia a los dos: cada uno queda en la silla del otro. Mientras se lo arrastra encima, las dos sillas se marcan en color de acento en vez del rechazo rojo, y al soltar se muestra un aviso con los dos nombres. Un invitado que viene del panel lateral no tiene silla para dar, así que sobre una silla ocupada sigue siendo rechazado (RF-22). | S | M |
| RF-42 | El editor funciona en celular. Por debajo de 768 px la barra superior se parte en dos filas (marca y evento arriba; contadores y acciones abajo, en una tira que se desplaza de costado), el panel de invitados pasa a ser una hoja inferior que se abre y se cierra tocando su encabezado, y el plano arranca con el zoom necesario para entrar entero en la pantalla. En ese modo no se arrastra: el invitado se sienta tocando una silla vacía (RF-25) y se saca desde el menú de la silla ocupada (RF-24). | S | M |
| RF-40 | El buscador del panel lateral encuentra también a los invitados ya sentados, que hoy quedan fuera de la lista. Aparecen en un bloque "Ya sentados" con el nombre de su mesa. Al elegir uno, el plano se desplaza solo hasta esa mesa y la silla del invitado queda marcada unos segundos. | S | M |
| RF-43 | El panel lateral lista a todos los invitados, no solo a los que faltan ubicar. Queda partido en dos secciones: "Sin ubicar", con las tarjetas arrastrables, y "Ya sentados", agrupada por mesa. Cada mesa es un subtítulo plegable con su cantidad, y tocar un nombre ilumina esa silla en el plano igual que RF-40. Los sentados se ven todo el tiempo, no solo al buscar. Mientras hay una búsqueda activa los pliegues se ignoran, para que ningún resultado quede escondido dentro de una mesa cerrada. | S | M |
| RF-25 | Click sobre una silla vacía abre un selector con la lista de invitados sin ubicar (con buscador) y un campo "Nuevo invitado" para escribir un nombre y sentarlo directamente. | M | M |
| RF-26 | "Autoubicar": sienta a todos los invitados sin ubicar, en el orden del panel, en las sillas libres recorriendo las mesas en orden. Si no alcanzan las sillas, los restantes quedan en el panel y se muestra un aviso. | S | S |

### 4.5 Persistencia

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-27 | Todo el estado se guarda automáticamente en el navegador. Al recargar la página, el evento sigue tal como estaba. | M | S |

### 4.6 Compartir y vista del invitado

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-28 | Botón "Compartir" que genera un link. El link contiene el estado del evento comprimido; no requiere servidor ni base de datos. Se copia al portapapeles con un click. | M | S |
| RF-29 | El diálogo de compartir muestra además un código QR del link. | S | S |
| RF-30 | Al abrir el link se muestra el nombre del evento, la fecha, el lugar y un campo "Buscá tu nombre". | M | S |
| RF-31 | La búsqueda es parcial, sin distinguir mayúsculas ni acentos. Si hay varias coincidencias se listan para elegir una. | M | S |
| RF-32 | Al encontrar al invitado se muestra "Estás en la mesa" seguido del nombre de la mesa en grande, el dibujo de esa mesa con todas las personas sentadas y la silla propia resaltada. | M | M |
| RF-33 | Si no hay coincidencias se muestra "No encontramos tu nombre. Consultá al organizador." | M | S |
| RF-34 | La vista del invitado funciona correctamente en celular. | M | S |

### 4.7 Exportación

| ID | Requerimiento | Prioridad | Tamaño |
|---|---|---|---|
| RF-35 | Botón "Exportar PNG" que descarga una imagen del plano completo con el nombre `plano-<evento>.png`. | S | S |

## 5. Requerimientos no funcionales

- **Sin backend**: la aplicación es 100 % frontend y se publica como sitio estático.
- **Navegadores**: el editor se usa en Chrome, Firefox o Edge, de escritorio o de celular (RF-42: en celular se asigna tocando la silla, sin arrastrar). La vista del invitado también en celular.
- **Link del invitado**: para 200 invitados el link comprimido ronda los 2 a 3 KB, muy por debajo del límite de los navegadores.
- **Verificación**: manual, con una checklist por requerimiento. No hay tests automatizados.
- **Idioma**: la interfaz y este documento están en español. El código, los identificadores y los commits están en inglés.

## 6. Pantallas y rutas

| Ruta | Pantalla | Contenido |
|---|---|---|
| `/` | Inicio | Logo, bajada y bloque "Tus eventos": tarjeta del evento guardado con sus contadores, o estado vacío con "Crear evento" (RF-41). |
| `/nuevo` | Creación | Formulario de creación con la vista previa de la plantilla (RF-01, RF-04). Al crear, redirige a `/plano`. |
| `/plano` | Editor | Barra superior (nombre, contadores, Autoubicar, Vaciar todo, Compartir, Exportar PNG, Nuevo evento), panel lateral de invitados y plano con las mesas. Sin evento redirige a `/`. |
| `/invitado#<estado>` | Vista del invitado | Cabecera del evento, buscador de nombre y resultado con el dibujo de la mesa. |

## 7. Modelo de datos

```ts
type Guest = {
  id: string;
  name: string;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  x: number;
  y: number;
  seats: (string | null)[]; // seats[i] = guest id or null; length === capacity
};

type Event = {
  name: string;
  date: string; // ISO yyyy-mm-dd
  place?: string;
  tables: Table[];
  guests: Guest[];
};
```

Un invitado está "sin ubicar" cuando su id no aparece en ninguna silla.

### Acciones del store (contrato compartido por todo el equipo)

```
createEvent(name, date, place?, template)
updateEvent(name, date, place?)
resetEvent()

addTable(capacity)
removeTable(tableId)
renameTable(tableId, name)
setTableCapacity(tableId, capacity)
moveTable(tableId, x, y)
clearTable(tableId)
clearAllTables()

addGuests(text)            // one name per line
addGuest(name): guestId
removeGuest(guestId)

seatGuest(guestId, tableId, seatIndex?)   // seatIndex omitted = first free seat
unseatGuest(guestId)
autoSeat()
```

Estas acciones se definen en la base común antes de dividir el trabajo. Cada persona programa su parte contra este contrato y no lo cambia sin avisar al equipo.

### Formato del link del invitado

Solo se comparte lo necesario para la vista del invitado:

```json
{ "v": 1, "n": "Casamiento Ana y Juan", "d": "2026-11-20", "p": "Salón Sur",
  "t": [ { "n": "Mesa 1", "s": ["Ana", "Juan", null, "Pedro"] } ] }
```

Se serializa a JSON, se comprime con `lz-string` (`compressToEncodedURIComponent`) y se coloca después del `#` en la ruta `/invitado`. El fragmento no viaja al servidor.

## 8. Stack

| Capa | Elección | Motivo |
|---|---|---|
| Base | Vite + React 19 + TypeScript | Arranque inmediato, recarga instantánea, tipado que evita errores al compartir el modelo entre tres personas. |
| Estilos | Tailwind CSS v4 | Estilos en el componente, sin conflictos de CSS entre ramas. |
| Estado | Zustand + middleware `persist` | Store pequeño con las acciones del evento. La persistencia en `localStorage` viene incluida. |
| Drag and drop | `@dnd-kit/core` | Una sola librería para arrastrar invitados a sillas y mesas por el plano. |
| Rutas | React Router | Dos rutas: editor y vista del invitado. |
| Link | `lz-string` | Comprime el estado dentro de la URL. |
| QR | `qrcode.react` | Componente listo para el diálogo de compartir. |
| PNG | `html-to-image` | Convierte el nodo del plano a imagen. |
| Deploy | Vercel conectado a GitHub | Deploy automático de `main` y preview por cada rama. Requiere un `vercel.json` con rewrite de todas las rutas a `index.html`. |

Sin tests, sin configuración de lint más allá de la que trae Vite, sin CI.

Alternativas descartadas:

- **Next.js + Supabase**: link corto real y persistencia en base de datos, a cambio de cuentas, tablas, permisos y más puntos de falla en cinco días.
- **HTML + JavaScript sin framework**: sin build, pero el drag and drop y el estado compartido se vuelven difíciles de mantener con tres personas editando lo mismo.

## 9. Estructura del proyecto

```
src/
  app/            router, layout, providers
  store/          Zustand store, types, actions, selectors
  features/
    event/        creation form, header, templates
    guests/       sidebar, bulk input, search
    tables/       canvas, table, seat, drag and drop
    share/        share dialog, link encoding, QR
    guest-view/   /invitado route
    export/       PNG export
  lib/            text normalization, id generation, seat geometry
```

## 10. Reparto preliminar del trabajo

La base común se hace primero y en conjunto: scaffold, store con el contrato de acciones, tipos, rutas y layout vacío. Luego se divide en tres ramas que no se pisan:

| Persona | Módulos | Requerimientos |
|---|---|---|
| A | Evento e invitados | RF-01 a RF-05, RF-13 a RF-19, RF-26 |
| B | Plano, mesas y drag and drop | RF-06 a RF-12, RF-20 a RF-25, RF-36, RF-37 |
| C | Compartir, vista del invitado y exportación | RF-27 a RF-35 |

RF-38 se acordó después de esta división y se implementó directamente en `main`: toca el contrato de drag and drop de la base, el panel lateral (módulo A) y el `DndProvider` (módulo B), así que no pertenece a ninguna de las tres ramas.

El detalle de tareas, orden y dependencias se define en el SDD.

## 11. Supuestos

- Los nombres repetidos se permiten; en la vista del invitado se listan todas las coincidencias.
- La capacidad de una mesa está entre 2 y 20.
- El plano tiene un tamaño fijo con scroll; las plantillas ubican las mesas en grilla dentro de ese espacio.
- No se valida que la cantidad de sillas cubra a todos los invitados; los contadores lo muestran.
