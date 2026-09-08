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
