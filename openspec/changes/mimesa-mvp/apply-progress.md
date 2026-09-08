# Apply progress: mimesa-mvp

## Batch 1 — Phase 0 frozen base (2026-09-08)

Executed by the orchestrator plus three parallel file-disjoint workers under the accepted `size:exception`.

- Completed: 0.1–0.19.
- Completed 0.20: build passes; the user confirmed in the browser that `/` renders the editor shell with six tables after creating the demo event, `/invitado` renders the guest placeholder, and `mimesa-event` persists across reload.
- Evidence: `npx tsc --noEmit -p tsconfig.app.json` exit 0; `npm run build` OK (50 modules, CSS 16.85 kB, JS 330 kB); geometry invariants verified at runtime (`tableBox(8)=120`, `tableBox(20)=258`, slot 19 fits 1600x1200); store semantics verified with a 66-assertion scratch harness (counters, persistence round-trip, version mismatch discard).
- Deviations recorded:
  - `src/lib/dnd.ts` follows design.md: `GuestDragData.from` is `{ tableId; seatIndex } | null` (null = sidebar) and `TableDragData` carries `x`/`y`; id builders are `guest:`, `tablemove:`, `seat:{t}:{i}`, `table:{t}`. Tracks A and B compile against these.
  - `src/index.css` uses `@theme static` so every token survives tree-shaking and works from inline `var()`.
  - Manrope is loaded from Google Fonts; the PNG export uses `skipFonts: true` and falls back to Segoe UI (accepted).
  - `occupancyOf(table)` returns `{ seated, capacity, tone }` (superset of design.md's terse line).
  - `ConfirmDialog` card is 360px wide (per the Menus mockup), not 480px.
  - `TableView` root sets `position: relative` inline; callers wrap it in their own positioned element.
  - `src/App.tsx`, `src/App.css`, `src/assets/`, `public/icons.svg` (Vite starter leftovers) deleted.
- Runtime attempt token (open, to be settled after 0.20): `sha256:ad180450cfc619c42716da7f1e40b7425380de99958cefe3741e4422197c4d3b`.

## Batch 2 — Track B worker 2: menus, seat picker, dialogs (B.4, B.5, B.6, B.9, B.10)

Branch `feat/track-b-canvas-dnd`, run in parallel with worker 1 (canvas, drag and drop).
Only new files under `src/features/tables/`; no frozen file and no other track's file touched.

- Completed: B.4, B.5, B.6, B.9, B.10.
- Files created (663 authored lines): `Popover.tsx` (92), `SeatPicker.tsx` (140),
  `SeatedGuestMenu.tsx` (105), `TableMenu.tsx` (161), `AddTableDialog.tsx` (109),
  `TableNameEdit.tsx` (56).
- Evidence: `npx tsc --noEmit -p tsconfig.app.json` exit 0. `npm run build` not run (worker 1's
  files were still in flight). Every Spanish string grep-verified against design.md's table and
  the files are UTF-8 without BOM.
- Deviations / decisions recorded:
  - `Popover.tsx` is a new shared helper not named in design.md's track B file list. The seat
    picker and both menus need identical placement, escape/outside-close and export-ignore
    behaviour; three copies of that logic was the alternative.
  - The popover is portalled to `document.body`. Seats and discs live inside transformed
    elements, and a transformed ancestor becomes the containing block of `position: fixed`,
    which would break viewport placement and clamping.
  - `SeatedGuestMenu` and `TableMenu` UNMOUNT the popover while their `ConfirmDialog` is open
    instead of stacking it underneath: the popover's outside-pointerdown listener would
    otherwise close the menu (and the dialog with it) before the "Confirmar" click landed.
    Cancelling returns to the menu.
  - The popover registers its outside-pointerdown listener on a 0ms timeout, so the pointerdown
    that opened it cannot immediately close it while still propagating to `document`.
  - `initialsOf` is duplicated inside `SeatPicker.tsx` (5 lines): the identical helper in the
    frozen `TableView.tsx` is private and that file must not be edited.
  - The capacity stepper markup is duplicated in `TableMenu.tsx` and `AddTableDialog.tsx`
    rather than extracted, to keep the track B file list exactly as design.md fixes it.
  - `SeatPicker` shows 6 rows plus a `+ N más` line (mockup `Menus.dc.html`); an empty list
    renders no rows and no extra copy, since design.md fixes no string for that state.
  - `AddTableDialog` checks `tables.length >= MAX_TABLES` before calling `addTable`, because the
    store action is a silent no-op at 20 and cannot raise the `Máximo 20 mesas.` notice itself.
  - `TableNameEdit` guards Enter/blur/Escape with a `doneRef` so one edit commits once, and
    stops pointer/click/dblclick propagation so the RF-11 centre-label drag never starts.
- Depends on worker 1: the click/double-click triggers for `SeatPicker`, `SeatedGuestMenu`,
  `TableMenu` and `TableNameEdit`, and the entry point for `AddTableDialog`, live in
  `TableNode.tsx` / `CanvasArea.tsx`. Every "Done when" browser check for B.4, B.5, B.6, B.9 and
  B.10 is therefore still MANUAL and unperformed at the time of this batch.
- Runtime attempt token (open, not settled):
  `sha256:0d5919313ff19588eeab2f273d8484c0cb5efac59430f8962cca9df2d8214054`.

### Batch 2 addendum — track B worker 1 (canvas + drag and drop)

- Completed: B.1, B.2, B.3, B.7, B.8, B.11, B.12. Files: `CanvasArea.tsx`, `TableNode.tsx`, `DndProvider.tsx`, `DragOverlayChip.tsx`.
- Orchestrator correction to design.md's collision snippet: the fallback after `pointerWithin` is `rectIntersection`, not `closestCenter`. With `closestCenter` a guest released over empty canvas was seated at the nearest table; now an empty hit list means "no drop" and dnd-kit returns the chip to its origin.
- Full-table rejection ring is applied through the `renderBody` wrapper sized like the disc. "Agregar mesa" is anchored bottom-left of the canvas (`data-export-ignore`). The dot grid lives on the inner canvas node, so it appears in the PNG export.
- Manual "Done when" checks for B.1–B.12 are pending the user's browser pass.

## Batch 3 — track B zoom, selection, size (B.13, B.14, B.15)

Branch `feat/track-b-canvas-dnd`, single worker, `delivery_strategy: single-pr`, `strict_tdd: false`.
Only `src/features/tables/**` touched; `TableView.tsx` and every frozen file left untouched.

- Completed: B.13 (RF-06 placement), B.14 (RF-36 canvas zoom), B.15 (RF-37 selection + table size).
- Files modified (~375 authored changed lines): `CanvasArea.tsx` (+214), `TableNode.tsx` (+125),
  `TableMenu.tsx` (+59), `DndProvider.tsx` (+25). No new file, no new dependency.
- Evidence: `npx tsc --noEmit -p tsconfig.app.json` exit 0; `npm run build` exit 0
  (`tsc -b && vite build`, 62 modules, built in 554ms); `npm run lint` (oxlint) exit 0 with only
  the three pre-existing warnings (`Popover.tsx` exhaustive-deps, `AddTableDialog.tsx`
  set-state-in-effect, `DndProvider.tsx` only-export-components).

### Canvas structure after B.13/B.14

`<main relative overflow-hidden>` → scroller (`canvas-scroll h-full w-full overflow-auto`) →
sizing box (`CANVAS_W*zoom x CANVAS_H*zoom`, `position: relative`) → `#mimesa-canvas`
(fixed `1600x1200`, `transform: scale(zoom)`, `transform-origin: 0 0`, absolute at 0,0).
The `Agregar mesa` button and the zoom group are siblings of the scroller inside `<main>`,
`data-export-ignore="true"`, so they never scroll away and never reach the PNG export.

### Note for track C (PNG export, RF-35)

`#mimesa-canvas` now carries `transform: scale(zoom)` whenever the organizer is not at 100%.
`html-to-image` serialises that transform, so a capture taken at 150% would render a 1.5x
canvas. Before capturing, neutralise it: either temporarily set `transform: 'none'` on the node
(and restore it afterwards) or pass `style: { transform: 'none', transformOrigin: '0 0' }` to
`toPng`, keeping `width: CANVAS_W` / `height: CANVAS_H`. The node's own layout size is still
exactly 1600x1200 at any zoom, so nothing else about the export contract changes.

### Deviations / decisions recorded

- Zoom is published to `DndProvider` through the existing `useDndFeedback` context
  (`zoom: RefObject<number>` plus `setCanvasZoom`), not through a new context exported from
  `CanvasArea.tsx`. `DndProvider` is mounted ABOVE `CanvasArea` in the frozen `AppLayout`, so a
  context provided by `CanvasArea` can never reach `onDragEnd`. A ref also avoids re-rendering
  every table on a zoom change; `TableNode` reads it only while a drag transform exists.
- Ctrl + wheel uses a native `addEventListener('wheel', ..., { passive: false })` on the
  scroller. React's `onWheel` is passive, so `preventDefault()` there is ignored and the browser
  zooms the whole page instead.
- The pointer-anchored scroll correction runs in a `useLayoutEffect` keyed on `zoom`, not inside
  the wheel handler: setting `scrollLeft` before the sizing box has been re-laid-out gets clamped
  against the old `scrollWidth`.
- Background deselection is wired on BOTH the sizing box and `#mimesa-canvas`
  (`event.target === event.currentTarget`). The scaled canvas node covers the sizing box exactly,
  so a click on empty canvas always lands on `#mimesa-canvas`, never on the sizing box; the
  handler on the sizing box alone would effectively never fire.
- Selection click and the accent outline live on the `renderBody` wrapper (`BodyDroppable`).
  In the frozen `TableView` the seats are SIBLINGS of the body wrapper, so a seat click cannot
  bubble into it — which is exactly the "not on a seat" rule of RF-37. The danger ring keeps
  precedence over the accent outline while a refused drop is being flashed.
- The selected table's `Tamaño` toolbar is `absolute bottom-full left-0 mb-2` inside the table
  node, so it lives on the canvas and scales with the canvas zoom (not with the table scale).
  A table dragged to y < 40 will have its toolbar clipped above the canvas origin; grid-placed
  tables start at `GRID_MARGIN = 50` and are unaffected.
- `TableNode`'s outer node now has an explicit `width/height = tableBox(capacity) * scale`, and
  the `TableView` drawing sits in an inner wrapper with `transform: scale(scale)` and
  `transform-origin: 0 0`. dnd-kit measures droppables with `getBoundingClientRect`, so seat and
  disc drop rects follow the visual scale without touching the frozen geometry helpers.
- The `Tamaño` stepper markup is duplicated between the floating toolbar and `TableMenu.tsx`,
  consistent with the `Capacidad` stepper already duplicated in `TableMenu`/`AddTableDialog`.
- The selection halo uses `shadow-[0_0_0_5px_rgba(79,70,229,.15)]`, mirroring the existing
  danger halo pattern `rgba(220,38,38,.15)` in the same file (accent is `#4f46e5`).
- Spanish strings added: `Tamaño` only. `Agregar mesa` is unchanged, just relocated. The zoom
  buttons carry the `aria-label`s `Alejar` / `Acercar`; the percent label reads e.g. `100 %`.

### Manual "Done when" checks still pending (browser)

- B.13: `Agregar mesa` visible without scrolling at any zoom and any scroll position.
- B.14: at 200% a 200px on-screen drag moves a table 100px on the canvas; the zoom label and the
  scrollbars update; Ctrl + wheel keeps the point under the pointer stable; a reload returns
  to 100%.
- B.15: select `Mesa 3`, press `+` twice → drawn at 1.5x with the same guests and still `5/8`;
  survives a reload; `+` disabled at 2x and `-` at 0.75x; drops onto its seats still work at 1.5x;
  Escape and a click on empty canvas deselect.
- Regression sweep for the batch: seat drops, the RF-22 rejection ring and toast, the table
  menus, rename and table move must all still work at 100% zoom.
- Runtime attempt token (open, not settled):
  `sha256:0d5919313ff19588eeab2f273d8484c0cb5efac59430f8962cca9df2d8214054`.
