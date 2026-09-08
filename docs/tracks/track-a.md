# Track A: evento e invitados

Rama: `feat/track-a-event-guests`. Requerimientos: RF-01 a RF-05, RF-13 a RF-19, RF-26.
Tareas: sección "Track A" de `openspec/changes/mimesa-mvp/tasks.md` (A.1 a A.11, en ese orden).

## Qué construís

Todo lo que rodea al plano: el formulario para crear el evento, la barra superior (nombre del evento, contadores, botones de acción) y el panel lateral de invitados sin ubicar con carga masiva, alta individual, buscador y borrado. Cuando terminás, el organizador puede crear un evento de verdad, pegar su lista y arrastrar gente del panel a las mesas.

## Carpetas propias

- `src/features/event/**`: `EventForm.tsx`, `Topbar.tsx`, `EventEditDialog.tsx`.
- `src/features/guests/**`: `GuestSidebar.tsx`, `GuestCard.tsx`, `BulkAddGuests.tsx`, `AddGuestInline.tsx`.

`EventForm.tsx`, `Topbar.tsx` y `GuestSidebar.tsx` ya existen como placeholders: reemplazalos. `Topbar.tsx` importa `ShareButton` y `ExportButton` desde las carpetas del track C; dejá esos imports como están (son placeholders que C va a completar).

## Contratos que usás (no los redefinas)

- Store: `useEventStore` en `src/store/useEventStore.ts`. Acciones de tu track: `createEvent(name, date, place, template)`, `updateEvent`, `resetEvent`, `addGuests(text)`, `addGuest(name)`, `removeGuest`, `clearAllTables`, `autoSeat()` (devuelve `{ seated, leftover }`).
- Selectores: `counters(event)`, `unseatedGuests(event)` en `src/store/selectors.ts`.
- Plantillas: `TEMPLATE_PRESETS`, `MIN_TABLES`, `MAX_TABLES`, `MIN_CAPACITY`, `MAX_CAPACITY` en `src/lib/constants.ts`.
- Búsqueda sin acentos: `normalize` en `src/lib/text.ts`.
- Arrastre: envolvé cada tarjeta del panel con `GuestDraggable` de `src/app/dnd/GuestDraggable.tsx` pasando `guestId` y `from: null`. Con eso el arrastre al plano funciona solo, porque el track B ya maneja los drops.
- Confirmaciones: `ConfirmDialog` de `src/app/ConfirmDialog.tsx`. Avisos: `toast()` de `src/app/useToastStore.ts`.

## Logo

Usá `/logo-mark.svg` (28 px) al lado del texto "MiMesa" en la barra superior, como ya está en el placeholder, y `/logo.svg` en el encabezado del formulario de creación. Detalle en `DESIGN.md`, sección "Logo".

## Pantallas a copiar

- `docs/design/CrearEvento.dc.html`: formulario y plantillas (A.1).
- `docs/design/Main.dc.html`: barra superior con contadores y botones, panel lateral con buscador, alta y tarjetas, área "Cargar lista" (A.2 a A.5, A.7 a A.11).

Textos exactos: tabla "Exact Spanish strings" en `openspec/changes/mimesa-mvp/design.md`, filas "Event form", "Event form validation", "Topbar", "Confirms", "Guests" y "Seating" (para los avisos de Autoubicar).

## Orden sugerido

1. A.1 formulario de creación. Es lo primero que se ve en la demo.
2. A.2 panel con tarjetas arrastrables. Desde acá ya se puede sentar gente arrastrando.
3. A.3 carga masiva y A.4 alta individual.
4. A.5 barra superior con "Nuevo evento", A.7 contadores, A.11 "Autoubicar", A.10 "Vaciar todas las mesas".
5. A.6 editar evento, A.8 buscador, A.9 borrar invitado desde la tarjeta.

Con A.1 a A.5 listos ya conviene abrir un primer PR.

## Checklist final (probar en local antes del PR)

Con `npm run dev`, empezando sin evento (borrá la clave `mimesa-event` de Local Storage en DevTools si hace falta):

1. Crear un evento con nombre y fecha, plantilla "6 mesas de 8". Aparece el editor con seis mesas. Sin nombre o sin fecha, muestra "Completá el nombre y la fecha." y no crea nada.
2. Plantilla "Personalizado" con 3 mesas de 4. Aparecen tres mesas de cuatro sillas. Con 25 mesas o capacidad 1 muestra el mensaje de rango y no crea.
3. Pegar en "Cargar lista" veinte nombres, algunos con espacios y renglones vacíos, dos repetidos. Aparecen exactamente veinte tarjetas, las repetidas como dos personas.
4. "Agregar invitado" con un nombre: una tarjeta más. Con espacios solos: nada, sin error bloqueante.
5. Arrastrar una tarjeta a una silla vacía: se sienta, desaparece del panel, los contadores cambian.
6. Arrastrarla a una mesa (no a una silla): va a la primera silla libre.
7. Buscador: escribir "jose" lista solo los José y Josefina, sin importar acentos ni mayúsculas. Borrarlo restaura la lista.
8. Contadores con 20 invitados, 6 mesas de 8 y 5 sentados: 20, 5, 15, 43.
9. "Autoubicar" con más invitados que sillas libres: sienta en orden del panel, y avisa cuántos quedaron afuera. Con un filtro de búsqueda activo, igual sienta a todos.
10. "Vaciar todas las mesas" con confirmación: todos vuelven al panel, las mesas quedan.
11. Borrar un invitado desde su tarjeta con confirmación: desaparece y bajan los contadores. Cancelar no cambia nada.
12. Editar evento: cambiar nombre, fecha y borrar el lugar. La barra muestra lo nuevo y nada más cambia.
13. "Nuevo evento" con confirmación: vuelve al formulario. Recargar sigue mostrando el formulario.
14. Recargar en cualquier punto anterior: todo sigue igual.
15. Regresión: zoom, menús de mesa, mover mesas y agregar mesa siguen funcionando.

## Terminado cuando

- Las 11 tareas marcadas `[x]` en `tasks.md`.
- `npx tsc --noEmit -p tsconfig.app.json`, `npm run build` y `npm run lint` sin errores.
- Checklist final completa.
- Ningún archivo fuera de `src/features/event/**` y `src/features/guests/**` cambiado (salvo `tasks.md`).
- PR a `main` abierto con la plantilla, y Marco avisado.
