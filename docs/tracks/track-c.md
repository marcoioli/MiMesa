# Track C: compartir, vista del invitado y exportar PNG

Rama: `feat/track-c-share-guestview-export`. Requerimientos: RF-27 a RF-35.
Tareas: sección "Track C" de `openspec/changes/mimesa-mvp/tasks.md` (C.1 a C.9, en ese orden).

## Qué construís

La salida del producto: el diálogo "Compartir" con link y QR, la vista del invitado en `/invitado` (buscar nombre, ver mesa) pensada para celular, y el botón "Exportar PNG" del plano. Además verificás que la persistencia (RF-27) funcione, sin escribir código para eso.

## Carpetas propias

- `src/features/share/**`: `buildSharePayload.ts`, `encode.ts`, `ShareButton.tsx`, `ShareDialog.tsx`.
- `src/features/guest-view/**`: `GuestView.tsx`, `GuestSearch.tsx`, `GuestResult.tsx`.
- `src/features/export/**`: `exportCanvas.ts`, `ExportButton.tsx`.

`ShareButton.tsx`, `ExportButton.tsx` y `GuestView.tsx` ya existen como placeholders: reemplazalos manteniendo el `export default` sin props, porque `Topbar` (track A) y `GuestViewPage` (base) los importan así.

## Contratos que usás (no los redefinas)

- Tipos: `SharePayload` en `src/store/types.ts` (`{ v: 1, n, d, p?, t: { n, s }[] }`, con `s` = nombres o `null`).
- Selectores: `seatNamesOf(event, table)` en `src/store/selectors.ts` para armar el payload.
- Constantes: `QR_MAX_URL`, `CANVAS_NODE_ID`, `EXPORT_IGNORE_ATTR` en `src/lib/constants.ts`.
- Texto: `normalize` (búsqueda sin acentos) y `slugify` (nombre del PNG) en `src/lib/text.ts`.
- Dibujo de la mesa en la vista del invitado: el `TableView` congelado de `src/features/tables/TableView.tsx`, en modo solo lectura: pasá `name`, `capacity`, `seatNames` y `highlightSeatIndex`, sin slots, sin nada de dnd-kit.
- Store: solo en el editor (`ShareButton`, `ExportButton`). **En `/invitado` nunca se importa `useEventStore`**: esa ruta lee únicamente el fragmento de la URL.

## Logo

En la vista del invitado usá `/logo-mark.png` (20 px) junto al texto "MiMesa" en el encabezado, como en el mockup. Detalle en `DESIGN.md`, sección "Logo".

## Pantallas a copiar

- `docs/design/Compartir.dc.html`: diálogo con link, "Copiar link", QR y nota (C.3, C.8).
- `docs/design/Invitado.dc.html`: búsqueda con varias coincidencias (C.4, C.5).
- `docs/design/InvitadoResultado.dc.html`: resultado con "Estás en la mesa" y el nombre en grande, dibujo de la mesa con la silla propia resaltada y lista "En tu mesa" (C.6, C.7).

Textos exactos: tabla "Exact Spanish strings" en `openspec/changes/mimesa-mvp/design.md`, filas "Share" y "Guest view". El resultado usa la leyenda "Estás en la mesa" y debajo el nombre de la mesa como título, para que una mesa renombrada ("Amigas") se lea bien.

## Reglas que no se negocian

- El payload se comprime con `compressToEncodedURIComponent` de lz-string y se escribe **crudo** en `/invitado#<payload>`. Se lee con `location.hash.slice(1)` y `decompressFromEncodedURIComponent`. Nunca `encodeURIComponent`, `decodeURIComponent` ni `URLSearchParams`.
- El QR se renderiza solo si `url.length <= QR_MAX_URL`. Si no, botón de copiar más la nota fija. `qrcode.react` lanza al renderizar si se pasa; el `try/catch` no sirve.
- Fragmento vacío, corrupto o con versión desconocida: se muestra "El link no es válido. Pedile uno nuevo al organizador." y no la búsqueda. Nunca una pantalla en blanco.
- Los invitados sin ubicar no viajan en el link (solo nombres sentados). Si alguien no está sentado, cae en "No encontramos tu nombre. Consultá al organizador.". Es intencional.
- Exportar PNG captura `document.getElementById(CANVAS_NODE_ID)`, el nodo interior fijo de 1600x1200. Ese nodo tiene `transform: scale(zoom)` por el zoom del plano: anulá la transformación durante la captura (por ejemplo con la opción `style: { transform: 'none' }` de `toPng`, o guardando y restaurando `style.transform`). Opciones: `pixelRatio: 2`, `backgroundColor: '#ffffff'`, `cacheBust: true`, `skipFonts: true`, `filter` que descarte los nodos con `data-export-ignore`. Antes, `await document.fonts.ready`. Si el resultado sale casi vacío (`dataUrl.length < 5000`), reintentá una vez. Nombre del archivo: `plano-<slug del evento>.png`.

## Orden sugerido

1. C.2 payload y codificación, C.3 botón y diálogo con "Copiar link". Con eso ya hay link.
2. C.4 vista del invitado leyendo el fragmento, C.5 búsqueda, C.6 resultado con la mesa.
3. C.7 ajuste a celular.
4. C.8 QR con el límite, C.9 exportar PNG.
5. C.1 verificación de persistencia (no toca código; se hace en cualquier momento y se marca).

Con C.2 a C.6 listos ya conviene abrir un primer PR.

## Checklist final (probar en local antes del PR)

Con `npm run dev` y un evento con 8 mesas, una renombrada, una movida, 40 invitados y 25 sentados (sentá gente desde el selector de silla vacía; cuando A esté, pegá una lista):

1. Recargar: nombres, fecha, lugar, mesas, posiciones, invitados y asientos idénticos. En una ventana de incógnito aparece el formulario de creación.
2. "Compartir": el campo muestra `http://localhost:5173/invitado#...`, "Copiar link" copia y muestra "¡Link copiado!". El link contiene `+` o `$` literales, sin `%2B`.
3. Pegar el link en una ventana de incógnito: aparece el nombre del evento, la fecha, el lugar y "Buscá tu nombre". Nada del editor se ve.
4. Escribir "jose" en minúscula y sin acento encuentra a "José". Dos invitados con el mismo nombre en mesas distintas aparecen como dos resultados con su mesa.
5. Elegir uno: "Estás en la mesa" con el nombre de la mesa en grande, el dibujo con su silla resaltada y los compañeros. La mesa renombrada muestra su nombre nuevo.
6. Un nombre que no existe (o un invitado sin sentar): "No encontramos tu nombre. Consultá al organizador.", sin dibujo.
7. Abrir `/invitado` sin fragmento, y con el fragmento recortado a la mitad: "El link no es válido. Pedile uno nuevo al organizador.", sin error en consola que rompa la página.
8. DevTools en 360x640: una sola columna, sin scroll horizontal, la mesa legible, los resultados se tocan con el dedo.
9. QR: con el evento de 40 invitados aparece un QR escaneable desde el celular (mismo wifi, o probá con el preview de Vercel). Con 200 invitados (pegá una lista larga) aparece la nota "El evento es muy grande para generar un QR..." y copiar sigue funcionando.
10. "Exportar PNG": descarga `plano-<evento>.png` con todas las mesas, incluso las que están fuera de la vista, sin menús ni botones flotantes, con el zoom en 150 % igual que en 100 %.
11. Regresión: arrastrar invitados, menús de mesa y zoom siguen funcionando en el editor.

## Terminado cuando

- Las 9 tareas marcadas `[x]` en `tasks.md`.
- `npx tsc --noEmit -p tsconfig.app.json`, `npm run build` y `npm run lint` sin errores.
- Checklist final completa, incluyendo el paso en celular o emulación.
- Ningún archivo fuera de `src/features/share/**`, `src/features/guest-view/**` y `src/features/export/**` cambiado (salvo `tasks.md`).
- PR a `main` abierto con la plantilla, y Marco avisado.
