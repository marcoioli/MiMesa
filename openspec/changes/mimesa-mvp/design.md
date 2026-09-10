# Design: MiMesa MVP (RF-01..RF-35)

## Technical Approach

Client-only SPA, feature-sliced, no backend and no tests (config `strict_tdd: false`). One frozen base commit on `main` carries the scaffold, the complete store, geometry, layout and the presentational `TableView`; three file-disjoint tracks then build UI against that base. Drag and drop follows exploration Approach A: a single `DndContext` spanning sidebar and canvas, discriminating on `active.data.current.type`.

Stack (versions verified in exploration 2.x): Vite + React 19 + TypeScript, Tailwind v4 via `@tailwindcss/vite@4.3.3`, `zustand@5.0.15` + `persist`, `@dnd-kit/core@6.3.1`, `react-router-dom@7.18.3`, `lz-string@1.5.0`, `qrcode.react@4.2.0`, `html-to-image@1.11.13`, npm, Vercel static + `vercel.json` rewrite.

Layout = requirements section 9 refined by exploration section 3:

```
src/
  app/          router, EditorPage, GuestViewPage, AppLayout, ConfirmDialog, Toast, dnd/GuestDraggable
  store/        types.ts, useEventStore.ts, selectors.ts
  lib/          constants.ts, geometry.ts, text.ts, ids.ts, dnd.ts
  features/
    event/      EventForm, EventEditDialog, Topbar                 (track A)
    guests/     GuestSidebar, BulkAddGuests, AddGuestInline, GuestCard  (track A)
    tables/     TableView (frozen) + CanvasArea, DndProvider, TableNode, menus, SeatPicker (track B)
    share/      buildSharePayload, encode, ShareDialog, ShareButton (track C)
    guest-view/ GuestView, GuestSearch, GuestResult                (track C)
    export/     ExportButton, exportCanvas                         (track C)
```

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|---|---|---|
| D1 | One `DndContext` in `AppLayout`, discriminate on `data.type` | Two nested contexts; dnd-kit for guests + raw pointer events for tables | Cross-context drags are impossible and a guest must travel sidebar → canvas. Tables need no droppable at all (apply `delta`), so the "two drag kinds" cost collapses to one `switch`. |
| D2 | `@dnd-kit/core@6.3.1`, not `@dnd-kit/react@0.5.0` | The rewrite | Requirements section 8 names `@dnd-kit/core`. `core` peer is `react >= 16.8`, so React 19 installs clean with no `--legacy-peer-deps`. `@dnd-kit/react` is pre-1.0 with a different API and thinner docs — unacceptable risk in a 5-day build. |
| D3 | All 16 store actions complete in the frozen base | Each track implements the actions it needs | `useEventStore.ts` would otherwise conflict on every merge between all three branches. This is the single decision that makes parallel work parallel. |
| D4 | `TableView.tsx` is presentational, frozen, with render slots | Track B and track C each draw a table | B (RF-09/10/11) and C (RF-32) need the identical drawing. Slots let B wrap seats as droppables while C renders read-only with zero dnd-kit imports. |
| D5 | Share payload carries **names**, not ids; `v: 1` | Full `Event` (ids + guests) | Requirements section 7 fixes this shape and `config.yaml` requires a minimal payload. Halves the URL, removes an id-resolution step in the guest view. Consequence: unseated guests are absent from the link and hit RF-33. Accepted (assumption 9). |
| D6 | `html-to-image`, not `html2canvas`/`html2canvas-pro` | Either canvas library | The infamous `unsupported color function oklch` failure is an html2canvas bug: it parses CSS in JS. `html-to-image` clones the node, copies **computed** styles and lets the browser paint via `<foreignObject>`, so Tailwind v4's oklch palette is never parsed by JS. Do not downgrade the palette. |
| D7 | npm | pnpm, yarn | Ships with Node on three Windows machines, deterministic lockfile, zero Vercel configuration. pnpm's speed does not pay for a global install + Windows symlink quirks + a Vercel install-command setting in 5 days. |
| D8 | Fragment written and read **raw** | `encodeURIComponent` / `URLSearchParams` | `lz-string`'s URI-safe alphabet contains `+` and `$`, and `decompressFromEncodedURIComponent` starts with `input.replace(/ /g, "+")`. Escaping or query-string round-tripping silently breaks every link. |
| D9 | QR guarded by URL length (1,200 chars), `level="L"` | try/catch around the QR | `qrcode.react@4.2.0` throws **synchronously during render** past the 2,953-byte byte-mode ceiling, which unmounts the dialog. A guard is the only fix that keeps the dialog alive. |
| D10 | Canvas 1600×1200, 5×4 grid, **max 20 tables** | Exploration assumption 1 (up to 30 tables) + assumption 2 (4 cols / 260 pitch / 60 margin) | 30 tables at a 260px pitch need 1,880px of height and do not fit a fixed 1600×1200 canvas. 5 cols × 290px + 4 rows × 270px from a 50px margin fits exactly 20 non-overlapping tables **even at capacity 20** (`tableBox(20) = 258`). 20 tables × 20 seats = 400 seats, double the 200-guest NFR. |
| D11 | ~~No sidebar droppable; unseating is menu-only (RF-24)~~ **Reversed.** The sidebar **is** a droppable: releasing a seated guest over it unseats them (RF-38), next to the RF-24 menu | Menu-only unseating, the original decision | Reversed on `main` after tracks A and B merged, at the product owner's request: dragging a guest out is the gesture organizers reach for first. The two rationales for the original decision are both spent — RF-38 now asks for it, and with A and B merged the "coupling A to B" cost is gone. The wiring is one `useDroppable` in `GuestSidebar.tsx`. Consequence to respect: the sidebar is a 300px full-height target, so it may only win a collision **under the pointer** and must be filtered out of the `rectIntersection` fallback, or it swallows drops meant for the empty canvas beside it. |
| D12 | Transient UI state (search text, open dialogs, selection) stays in component state | Add it to the store behind `partialize` | Keeps `localStorage` clean and keeps the frozen store from becoming a merge point again. |

## Data Model and Store

### `src/store/types.ts` (frozen)

```ts
export type Guest = { id: string; name: string };

export type Table = {
  id: string; name: string; capacity: number;
  x: number; y: number;            // top-left of the table box on the canvas
  seats: (string | null)[];        // seats[i] = guest id | null; length === capacity
};

export type Event = { name: string; date: string; place?: string; tables: Table[]; guests: Guest[] };

export type TableTemplate = { count: number; capacity: number };   // presets live in lib/constants.ts

export type SharePayload = {
  v: 1; n: string; d: string; p?: string;
  t: { n: string; s: (string | null)[] }[];   // s[i] = guest NAME | null
};
```

`seats: (string | null)[]` is deliberate: `null` survives `JSON.stringify` unchanged, so `persist` needs no custom serializer (a `Map`/`Set` would have forced one).

### Action contract — 16 actions (correction)

`proposal.md` and `exploration.md` both say "18 actions". The list in `docs/requirements.md` section 7 — the authoritative contract — contains **16**. No action is added or removed; the count was a miscount and downstream phases must use 16.

Three **return-type refinements** (names and arities unchanged), each required by an RF that cannot be satisfied by inspecting the store afterwards:

| Action | Contract | Refinement | Why |
|---|---|---|---|
| `addGuest(name)` | `: guestId` | `: string \| null` | RF-25 seats the new guest immediately; `null` expresses the empty-name guard. |
| `seatGuest(...)` | `void` | `: boolean` | RF-22 needs an immediate reject signal for the red ring + toast; diffing the store is racy. |
| `autoSeat()` | `void` | `: { seated: number; leftover: number }` | RF-26 must show "quedaron N sin ubicar". |

### Semantics (exact)

| Action | Behaviour |
|---|---|
| `createEvent(name, date, place?, template)` | Trims name/place (`''` → `undefined`); builds `template.count` tables named `Mesa 1..N` with `seats = Array(capacity).fill(null)` at `gridLayout(i)`; `guests: []`. Replaces any existing event. |
| `updateEvent(name, date, place?)` | No-op when `event === null`. Trims; preserves tables and guests. |
| `resetEvent()` | `event = null`; `persist` writes `{ event: null }`. |
| `addTable(capacity)` | No-op when `tables.length >= MAX_TABLES (20)` (caller toasts "Máximo 20 mesas."). Clamps capacity to 2..20. Name = `Mesa ${1 + max numeric suffix of existing "Mesa N" names}` so deletions never produce duplicate names (RF-32 shows the name). Position = `gridLayout(tables.length)`, clamped. |
| `removeTable(tableId)` | Drops the table. **No guest is deleted** — its occupants stop appearing in any `seats` array and therefore become unseated, which is exactly "vuelven al panel lateral" (RF-06). Other tables are not renumbered. |
| `renameTable(tableId, name)` | Trims; empty → no-op (previous name kept). |
| `setTableCapacity(tableId, capacity)` | Clamps to 2..20. Growing appends `null`s; shrinking does `seats.slice(0, capacity)`, so occupants of removed seats become unseated and return to the sidebar (RF-07). |
| `moveTable(tableId, x, y)` | Clamps: `x ∈ [0, CANVAS_W - tableBox(capacity)]`, `y ∈ [0, CANVAS_H - tableBox(capacity)]` (assumption 5 — no `@dnd-kit/modifiers`). |
| `clearTable(tableId)` | `seats = seats.map(() => null)` (RF-12). |
| `clearAllTables()` | Same across every table (RF-13). |
| `addGuests(text)` | `text.split(/\r?\n/).map(trim).filter(Boolean)`, one `Guest` each, appended in order. Duplicate names allowed (RF-14). |
| `addGuest(name)` | Trimmed empty → `null`, nothing created. Otherwise appends and returns the new id. |
| `removeGuest(guestId)` | Removes from `guests` **and** nulls its seat if seated (RF-17, both entry points). |
| `seatGuest(guestId, tableId, seatIndex?)` | See below; returns `true` only when the model changed or the guest was already on the requested seat. |
| `unseatGuest(guestId)` | Nulls the occupied seat. Guest stays in `guests`. **Not seated → no-op**, returns silently. |
| `autoSeat()` | Iterates `unseatedGuests(event)` in `guests` insertion order — **ignores the RF-18 search filter** (assumption 8) — over tables in array order, seats in index order. Returns `{ seated, leftover }`. |

```ts
seatGuest(guestId, tableId, seatIndex) {
  const { event } = get(); if (!event) return false;
  const table = event.tables.find(t => t.id === tableId);
  const guest = event.guests.find(g => g.id === guestId);
  if (!table || !guest) return false;

  let index = seatIndex;
  if (index === undefined) index = table.seats.findIndex(s => s === null);   // RF-21 first free seat
  if (index < 0 || index >= table.capacity) return false;                    // table full / bad index
  const occupant = table.seats[index];
  if (occupant !== null && occupant !== guestId) return false;               // RF-22 occupied: no-op

  set(state => /* 1. null this guest's previous seat in ANY table (RF-23 reseat is atomic)
                  2. write guestId into tables[tableId].seats[index] */);
  return true;
}
```

### Selectors (`src/store/selectors.ts`, frozen) — pure over `Event | null`

`seatedGuestIds(event): Set<string>` · `unseatedGuests(event): Guest[]` · `guestNamesById(event): Map<string,string>` · `seatNamesOf(event, table): (string | null)[]` · `occupancyOf(table): number` · `counters(event): { total, seated, unseated, freeSeats }` where `freeSeats = sum(table.capacity) - seated` (assumption 13, RF-19).

### Persistence (RF-27)

```ts
export const useEventStore = create<EventState>()(persist(
  (set, get) => ({ event: null, /* 16 actions */ }),
  {
    name: 'mimesa-event',
    version: 1,
    partialize: (s) => ({ event: s.event }),
    migrate: () => ({ event: null }),   // any older/unknown version starts fresh (see Rollback)
  },
));
```

`localStorage` is synchronous, so hydration completes before first paint: no hydration flash, no `onRehydrateStorage`/`hasHydrated` gate.

## Drag and Drop (Approach A)

`DndProvider` (track B) is mounted by `AppLayout` (frozen) around both the sidebar and the canvas.

```ts
// src/lib/dnd.ts (frozen) — the contract both tracks compile against
export type GuestDragData = { type: 'guest'; guestId: string; from: { tableId: string; seatIndex: number } | null };
export type TableDragData = { type: 'table'; tableId: string; x: number; y: number };
export type SeatDropData  = { type: 'seat'; tableId: string; seatIndex: number };
export type TableDropData = { type: 'table'; tableId: string };
export type SidebarDropData = { type: 'sidebar' };                    // RF-38, D11 reversed

export const guestDragId = (id: string) => `guest:${id}`;
export const tableDragId = (id: string) => `tablemove:${id}`;
export const seatDropId  = (t: string, i: number) => `seat:${t}:${i}`;
export const tableDropId = (t: string) => `table:${t}`;
export const SIDEBAR_DROP_ID = 'sidebar';                             // fixed id, single droppable
```

- **Sensors**: `useSensor(PointerSensor, { activationConstraint: { distance: 5 } })`. Under 5px of movement no drag starts, so RF-24 (click a seated guest) and RF-08 (double-click the table name) coexist with RF-23 and RF-11 on the same elements. Draggables set `style={{ touchAction: 'none' }}`.
- **Nested-draggable fix**: the table's `listeners` go on the **centre label only** (`renderCenter` slot), never on the whole table — otherwise `pointerdown` on a seated guest would bubble and start a table drag.
- **Collision detection** (composed; the default `rectIntersection` is documented as poor for the ~28px seats):

```ts
const collision: CollisionDetection = (args) => {
  if ((args.active.data.current as DragData)?.type === 'table') return [];      // tables need no droppable
  // NOT closestCenter as the fallback: it always returns a hit, so a guest released over
  // empty canvas would be seated at the nearest table. rectIntersection only matches
  // droppables the dragged chip overlaps - and never the sidebar, a 300px full-height
  // target that would otherwise swallow drops meant for the canvas beside it (RF-38).
  const within = pointerWithin(args);
  const hits = within.length ? within
    : rectIntersection(args).filter(h => dropDataOf(h.data)?.type !== 'sidebar');
  // droppableContainers is an array in @dnd-kit/core 6.x; the collision payload already carries the container
  const seats = hits.filter(h => h.data?.droppableContainer?.data.current?.type === 'seat');
  return seats.length ? seats : hits;                                            // seat beats table body
};
```

- **`onDragEnd`**:

```ts
const data = active.data.current as DragData | undefined; if (!data) return;
if (data.type === 'table') return moveTable(data.tableId, data.x + delta.x, data.y + delta.y); // action clamps
const drop = over?.data.current as DropData | undefined;
if (!drop) return;                                    // dropped nowhere: dnd-kit reverts, no state change (RF-22)
const ok = drop.type === 'seat'
  ? seatGuest(data.guestId, drop.tableId, drop.seatIndex)
  : seatGuest(data.guestId, drop.tableId);            // RF-21
if (!ok) { flashRejected(over.id); toast(drop.type === 'seat' ? 'Esa silla ya está ocupada.' : 'La mesa está completa.'); }
```

- **Rejection feedback (RF-22)**: `onDragOver` marks an occupied seat / full table so `TableView` renders `rejectedSeatIndex` as a red ring; on a rejected `onDragEnd` the ring flashes ~600ms plus a toast. dnd-kit already returns the item to origin, so no revert logic exists.
- **`DragOverlay`** renders a minimal guest chip built inside `DndProvider` (track B). It does **not** import track A's `GuestCard` — that would cross a track boundary for a styled `<div>`.
- Guest draggables are created through the frozen `src/app/dnd/GuestDraggable.tsx` wrapper (`{ guestId, from, children }`), so track A makes sidebar cards draggable and track B makes seated guests draggable without either editing the other's files.

## Seat Geometry (`src/lib/geometry.ts`, frozen)

```ts
export const SEAT = 28;
export const seatRadius  = (c: number) => Math.max(46, Math.ceil((36 * c) / (2 * Math.PI))); // 46 @c≤8, 58 @10, 115 @20
export const tableRadius = (c: number) => seatRadius(c) - SEAT / 2;   // disc; seats straddle its edge
export const tableBox    = (c: number) => 2 * (seatRadius(c) + SEAT / 2);  // 120 @c=8, 258 @c=20
export const seatAngle   = (i: number, c: number) => -Math.PI / 2 + (2 * Math.PI * i) / c; // seat 0 at 12 o'clock
export const seatOffset  = (i: number, c: number) =>
  ({ x: seatRadius(c) * Math.cos(seatAngle(i, c)), y: seatRadius(c) * Math.sin(seatAngle(i, c)) });
export const seatPositions = (c: number) => Array.from({ length: c }, (_, i) => seatOffset(i, c));

export const gridLayout = (i: number) => ({                    // 5 cols × 4 rows = 20 slots (D10)
  x: GRID_MARGIN + (i % GRID_COLS) * GRID_PITCH_X,
  y: GRID_MARGIN + Math.floor(i / GRID_COLS) * GRID_PITCH_Y,
});
export const clampToCanvas = (x: number, y: number, c: number) => ({
  x: Math.min(Math.max(0, x), CANVAS_W - tableBox(c)),
  y: Math.min(Math.max(0, y), CANVAS_H - tableBox(c)),
});
```

`src/lib/constants.ts` (frozen): `CANVAS_W = 1600`, `CANVAS_H = 1200`, `GRID_COLS = 5`, `GRID_PITCH_X = 290`, `GRID_PITCH_Y = 270`, `GRID_MARGIN = 50`, `MIN_CAPACITY = 2`, `MAX_CAPACITY = 20`, `MAX_TABLES = 20`, `QR_MAX_URL = 1200`, `CANVAS_NODE_ID = 'mimesa-canvas'`, `EXPORT_IGNORE_ATTR = 'data-export-ignore'`, `TEMPLATE_PRESETS`.

Seats are absolutely positioned real DOM (`left: calc(50% + x)`, `top: calc(50% + y)`, `transform: translate(-50%, -50%)`) — not SVG — so they are genuine drop targets and `html-to-image` handles them.

## `TableView` Contract (`src/features/tables/TableView.tsx`, frozen)

```tsx
export type OccupancyTone = 'empty' | 'partial' | 'full';
export type TableViewProps = {
  name: string;
  capacity: number;
  seatNames: (string | null)[];          // length === capacity
  highlightSeatIndex?: number;           // RF-32 "your seat"
  rejectedSeatIndex?: number;            // RF-22 red ring
  occupancyTone?: OccupancyTone;         // derived from seatNames when omitted (RF-10)
  onSeatClick?: (index: number) => void; // RF-25
  renderSeat?:   (s: { index: number; name: string | null; node: ReactNode }) => ReactNode;
  renderBody?:   (node: ReactNode) => ReactNode;    // the disc → table-body droppable (RF-21)
  renderCenter?: (node: ReactNode) => ReactNode;    // label block → drag handle / dblclick / menu
  className?: string;
};
```

- Root is `position: relative`, `width/height = tableBox(capacity)`.
- Each seat is rendered inside an absolutely positioned `SEAT × SEAT` wrapper; `renderSeat` wraps the **inner** node and its wrapper MUST be `w-full h-full` so the droppable rect matches the seat.
- Centre shows the truncated name (`title` attribute for the full value) plus occupancy `5/8` on a second line (assumption 3).
- Occupancy tone (assumption 4): empty `bg-slate-200 border-slate-300`, partial `bg-amber-100 border-amber-300`, full `bg-emerald-100 border-emerald-400`.
- Track C passes **no** slots → a pure read-only drawing with zero dnd-kit involvement.

## Share and Guest View

```ts
// src/features/share/encode.ts (track C)
export function buildShareUrl(payload: SharePayload): string {
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  // NEVER encodeURIComponent(encoded): lz-string's URI-safe alphabet contains '+' and '$',
  // both legal in a fragment. Escaping them, or routing through URLSearchParams, breaks decompression.
  return `${window.location.origin}/invitado#${encoded}`;
}

export function readSharePayload(hash: string): SharePayload | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;   // NEVER decodeURIComponent
  if (!raw || raw.length > 100_000) return null;             // untrusted input cap
  try {
    const json = decompressFromEncodedURIComponent(raw);
    const data = json ? (JSON.parse(json) as SharePayload) : null;
    return data && data.v === 1 && Array.isArray(data.t) ? data : null;
  } catch { return null; }
}
```

- **Payload build**: `{ v: 1, n, d, ...(place ? { p: place } : {}), t: tables.map(t => ({ n: t.name, s: seatNamesOf(event, t) })) }`. Names only, so unseated guests are absent from the link (D5).
- **QR (RF-29)**: `url.length <= QR_MAX_URL` → `<QRCodeCanvas value={url} size={256} level="L" />`; otherwise render the copy-link button plus "El evento es muy grande para generar un QR. Copiá el link y compartilo."
- **`/invitado` never imports `useEventStore`** — importing it would hydrate the *visitor's* own `localStorage`, which is not the shared event. Enforced by an explicit comment in `GuestViewPage.tsx` and by a spec scenario.
- **Matching (RF-31)**: `normalize(name).includes(normalize(query))` over every `(name, tableName, seatIndex)` tuple. Duplicates produce several tuples; picking one carries the exact `seatIndex` to `TableView`'s `highlightSeatIndex`, so RF-32's highlight is unambiguous (assumption 10).
- **Failure states**: no match renders the RF-33 message ("No encontramos tu nombre. Consultá al organizador."). An empty fragment, an undecodable fragment, or `v !== 1` renders the invalid-link message ("El link no es válido. Pedile uno nuevo al organizador.") instead of the search box; nothing crashes.

```ts
// src/lib/text.ts (frozen)
const COMBINING_MARKS = /[\u{0300}-\u{036f}]/gu;          // combining diacritics, stripped after NFD
export const normalize = (s: string) =>
  s.trim().toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
export const slugify   = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'evento';
```

## PNG Export (RF-35)

```ts
const node = document.getElementById(CANVAS_NODE_ID);          // frozen DOM contract, set by track B
if (!node) return;
await document.fonts.ready;                                     // avoids the blank first frame
const options = { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true, skipFonts: true,
  filter: (n: HTMLElement) => n.dataset?.exportIgnore !== 'true' };
let dataUrl = await toPng(node, options);
if (dataUrl.length < 5000) dataUrl = await toPng(node, options); // documented one-shot retry
const a = document.createElement('a');
a.href = dataUrl; a.download = `plano-${slugify(event.name)}.png`; a.click();
```

`skipFonts: true` + Tailwind's system `font-sans` removes the whole `embedWebFonts` / cross-origin `SecurityError` class. Every overlay, menu, popover and the `DragOverlay` carries `data-export-ignore="true"` (frozen attribute contract) so the `filter` drops them.

## UI Composition and Spanish Copy

`router.tsx`: `/` → `EditorPage`, `/invitado` → `GuestViewPage`, `*` → redirect `/`.
`EditorPage`: `event ? <AppLayout/> : <EventForm/>`.
`AppLayout`: `<DndProvider>` wrapping `<Topbar/>` over `[<GuestSidebar/> | <CanvasArea/>]`, plus `<ToastHost/>`.
`ConfirmDialog` (frozen) API: `{ open, message, confirmLabel?, onConfirm, onCancel }` — used by RF-03, RF-06, RF-13, RF-17 (assumption 12; never `window.confirm`).
`useToastStore` (frozen, non-persisted zustand) exposes `toast(message)`; used by RF-22 (track B) and RF-26 (track A).

Exact Spanish strings the specs fix:

| Context | String |
|---|---|
| Event form (RF-01/04) | `Nombre del evento` · `Fecha` · `Lugar (opcional)` · `Crear evento` · `6 mesas de 8` · `10 mesas de 10` · `8 mesas de 6` · `Personalizado` · `Cantidad de mesas` · `Capacidad` |
| Topbar (RF-03/13/19/26/28/35) | `Nuevo evento` · `Vaciar todas las mesas` · `Autoubicar` · `Compartir` · `Exportar PNG` · `Invitados` · `Sentados` · `Sin ubicar` · `Sillas libres` |
| Confirms | `¿Crear un evento nuevo? Se borrará el evento actual.` · `¿Eliminar la mesa? Sus invitados vuelven al panel.` · `¿Vaciar todas las mesas? Los invitados vuelven al panel.` · `¿Eliminar a este invitado?` · `Cancelar` · `Confirmar` |
| Guests (RF-14/16/18) | `Un nombre por renglón` · `Aceptar` · `Agregar invitado` · `Buscar invitado` |
| Tables (RF-06/07/12) | `Agregar mesa` · `Eliminar mesa` · `Vaciar mesa` · `Capacidad` · `Máximo 20 mesas.` |
| Seating (RF-22/24/25/26) | `Esa silla ya está ocupada.` · `La mesa está completa.` · `Quitar de la mesa` · `Eliminar invitado` · `Sentar invitado` · `Nuevo invitado` · `Sentar` · `Se ubicaron N invitados.` · `Quedaron N invitados sin ubicar por falta de sillas.` |
| Share (RF-28/29) | `Copiar link` · `¡Link copiado!` · `El evento es muy grande para generar un QR. Copiá el link y compartilo.` |
| Guest view (RF-30/32/33) | `Buscá tu nombre` · `Estás en la mesa` (caption line) followed by `{nombreDeMesa}` as the headline on its own line, so renamed tables such as "Amigas" read correctly · `No encontramos tu nombre. Consultá al organizador.` · `El link no es válido. Pedile uno nuevo al organizador.` |
| Event form validation (RF-01/04) | `Completá el nombre y la fecha.` · `Ingresá entre 1 y 20 mesas y una capacidad entre 2 y 20.` |

## Ownership Resolution

The proposal flagged RF-06, RF-07, RF-08 and RF-12: requirements section 10 gives them to track A, but their only UI entry points (table menu, inline rename, add-table dialog) live inside `src/features/tables/**`, which is track B's folder.

**Resolution: move RF-06, RF-07, RF-08 and RF-12 to track B.** They are table-local interactions on table components; splitting them would force A and B to edit the same files, which is exactly what the branch plan forbids. Track A keeps every non-table-local requirement, including RF-13 (`clearAllTables` from the Topbar, a pure store call) and RF-26.

Revised RF ownership — A: RF-01..RF-05, RF-13..RF-19, RF-26. B: RF-06..RF-12, RF-20..RF-25. C: RF-27..RF-35 (RF-27 lands in the frozen base; C verifies it). RF-17 is shared by intent only: the sidebar delete is A's `GuestCard`, the from-the-seat delete is B's `SeatedGuestMenu`; both call the same frozen `removeGuest`.

**Share/Export buttons**: `Topbar.tsx` (track A) **imports** `ShareButton` from `src/features/share/` and `ExportButton` from `src/features/export/` (track C). Both are frozen-contract zero-prop default-exported components created as placeholders in the base commit and implemented by C. Chosen over passing them into `Topbar` as slots because slots would put the wiring in `AppLayout` and leak C's concerns into the frozen layout; with imports, A never edits a C file and C never edits `Topbar.tsx`.

### File ownership (no file has two owners)

| Owner | Files |
|---|---|
| **Frozen** (base commit on `main`; later edits need team agreement) | `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `vercel.json`, `src/main.tsx`, `src/index.css`, `src/app/router.tsx`, `src/app/EditorPage.tsx`, `src/app/GuestViewPage.tsx`, `src/app/AppLayout.tsx`, `src/app/ConfirmDialog.tsx`, `src/app/Toast.tsx`, `src/app/useToastStore.ts`, `src/app/dnd/GuestDraggable.tsx`, `src/store/types.ts`, `src/store/useEventStore.ts`, `src/store/selectors.ts`, `src/lib/constants.ts`, `src/lib/geometry.ts`, `src/lib/text.ts`, `src/lib/ids.ts`, `src/lib/dnd.ts`, `src/features/tables/TableView.tsx` |
| **A** — event + guests | `src/features/event/EventForm.tsx`, `EventEditDialog.tsx`, `Topbar.tsx`; `src/features/guests/GuestSidebar.tsx`, `BulkAddGuests.tsx`, `AddGuestInline.tsx`, `GuestCard.tsx` |
| **B** — canvas + DnD | `src/features/tables/CanvasArea.tsx`, `DndProvider.tsx`, `TableNode.tsx`, `TableMenu.tsx`, `TableNameEdit.tsx`, `AddTableDialog.tsx`, `SeatPicker.tsx`, `SeatedGuestMenu.tsx` |
| **C** — share + guest view + export | `src/features/share/buildSharePayload.ts`, `encode.ts`, `ShareDialog.tsx`, `ShareButton.tsx`; `src/features/guest-view/GuestView.tsx`, `GuestSearch.tsx`, `GuestResult.tsx`; `src/features/export/ExportButton.tsx`, `exportCanvas.ts` |

Every file listed under A, B and C is created as a compiling placeholder in the base commit, so all three branches start from a green `npm run build`.

## Data Flow

```
  EventForm / Topbar (A)      TableNode / SeatPicker (B)      ShareButton (C)
          │                             │                            │
          └────── 16 actions ───────────┴────── read-only ───────────┘
                          ▼
                   useEventStore  ──persist──► localStorage['mimesa-event']  (RF-27)
                          │
              selectors ──┼──────────────► TableView (frozen drawing)
                          ▼
                   buildSharePayload ──► lz-string ──► /invitado#<payload>
                                                              │  (never reaches Vercel)
                                                              ▼
                                        GuestViewPage ──► readSharePayload ──► TableView
                                        (never imports the store)
```

Drag: `GuestDraggable` (sidebar or seat) → `DndContext` (AppLayout) → composed collision → `onDragEnd` → `seatGuest` → store → re-render.

## File Changes

Greenfield: every file is **Create**. Counts — frozen base 25, track A 7, track B 8, track C 9, plus the Vite template files. Exact paths are in the ownership table above; `sdd-tasks` derives work units from it.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit / Integration / E2E | — | **N/A by explicit decision** (requirements 2.2, `config.yaml` `strict_tdd: false`). Do not add a test runner, test files or CI. |
| Build gate | Compilation and types | `npm run build` and `npx tsc --noEmit` on `main`. |
| Manual checklist | RF-01..RF-35 | One checklist item per RF on the Vercel deploy: desktop editor (Chrome/Firefox/Edge), guest view also on a phone. |
| Manual scale check | RF-28/29 | A 60-guest event shares via QR; a 200-guest event shares via copied link without a crash. |

## Threat Matrix

N/A — no shell commands, subprocesses, VCS/PR automation, executable-file classification, or process integration. Client-side React Router routing carries no server-side path resolution. One untrusted input exists and is handled inline: the URL fragment is length-capped at 100,000 chars before decompression, `JSON.parse` is wrapped in `try/catch`, the shape is validated (`v === 1`, `Array.isArray(t)`), and all payload values render as React text — no `dangerouslySetInnerHTML`, no `eval`, no URL is constructed from payload data.

## Migration / Rollout

- No data migration: greenfield with an empty `localStorage` on first load.
- Persisted shape change mid-week → bump `persist.version`; `migrate` returns `{ event: null }`. Data loss is accepted for the demo (proposal rollback plan).
- Share payload change → bump `v`; the guest view rejects an unknown `v` with the invalid-link message.
- Rollout: base commit on `main` → three branches with Vercel previews → merge in any order (file-disjoint) → production deploy from `main`.

## Open Questions

- [x] RF-06/07/08/12 ownership — resolved: track B (see Ownership Resolution).
- [x] Where "Compartir" / "Exportar PNG" render — resolved: `Topbar` (A) imports two zero-prop components from C.
- [x] Store action count — resolved: 16 per `docs/requirements.md` section 7; "18" upstream is a miscount.
- [x] Max table count vs. canvas size — resolved: `MAX_TABLES = 20` on a 5×4 grid (D10), refining exploration assumptions 1 and 2.
- None blocking.

## Implementation notes added by the design validation gate

- **Full-table rejection ring (seating spec, RF-22)**: `TableViewProps` only carries `rejectedSeatIndex`. Track B renders the red ring on a full table through the `renderBody` slot (or an equivalent wrapper class on the table disc) while a guest is dragged over it. No change to the frozen `TableView` contract is needed.
- **Export capture target (export spec, RF-35)**: `CANVAS_NODE_ID` MUST be placed on the fixed 1600x1200 inner canvas node, never on the scrolling container. Otherwise `toPng` captures only the visible viewport and off-screen tables are lost.
- **Collision detection**: `@dnd-kit/core` 6.x passes `droppableContainers` to a `CollisionDetection` function as an array. Read the container from the collision payload (`collision.data.droppableContainer`) as shown in the snippet above.
