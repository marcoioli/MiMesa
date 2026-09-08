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
