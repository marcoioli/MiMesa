# Proposal: MiMesa MVP (RF-01..RF-35)

## Intent

Build MiMesa from an empty repo into a working, deployed demo by 2026-09-12: a client-only web app where an organizer creates an event, seats guests at round tables by drag and drop, and shares a read-only guest view through a compressed URL fragment. Product truth is `docs/requirements.md` (confirmed). Success = every RF passes its manual checklist item on the Vercel deploy, and three people build it in parallel without merge conflicts.

## Scope

### In Scope
- Event lifecycle and templates: RF-01..RF-04.
- Tables on a fixed scrolling canvas: RF-05..RF-13.
- Guest list, bulk load, search, counters: RF-14..RF-19.
- Seating by drag and drop, click menus, auto-seat: RF-20..RF-26.
- Auto-persistence in `localStorage`: RF-27.
- Share link + QR, mobile-friendly guest view: RF-28..RF-34.
- PNG export of the canvas: RF-35.
- Vercel static deploy with SPA rewrite.

### Out of Scope
- Everything in requirements section 2.2: backend, accounts, non-round tables, guest groups, multiple events, import from link, printable list, RSVP, undo, dark mode, automated tests.
- CI, lint config beyond the Vite template, `@dnd-kit/react`, `@dnd-kit/modifiers`.

## Capabilities

### New Capabilities
- `event`: create/edit/reset the event; template choice (RF-01..RF-04).
- `tables`: template materialization, grid layout, table CRUD, capacity, rename, move, clear, drawing and occupancy colour (RF-04..RF-13).
- `guests`: bulk/individual add, remove, search, counters (RF-14..RF-19).
- `seating`: seat/reseat/unseat via drop targets, rejection feedback, click menus, auto-seat (RF-20..RF-26).
- `persistence`: whole-event round trip through `localStorage` (RF-27).
- `share`: payload encoding, link, clipboard, QR with length guard (RF-28, RF-29).
- `guest-view`: `/invitado` reads only the fragment; search, table drawing with highlighted seat, not-found state, mobile (RF-30..RF-34).
- `export`: canvas node to `plano-<slug>.png` (RF-35).

### Modified Capabilities
- None (greenfield; `openspec/specs/` is empty).

## Approach

Adopt `exploration.md` in full.

1. **Frozen common base first, on `main`, built together.** Vite + React 19 + TS scaffold, Tailwind v4, router (`/`, `/invitado`), `AppLayout` with sidebar + canvas inside one `DndContext`, `ConfirmDialog`, `store/types.ts`, `useEventStore.ts` with **all 16 contract actions fully implemented** plus `persist`, `selectors.ts`, `lib/geometry.ts`, `lib/text.ts`, `lib/ids.ts`, presentational `TableView.tsx`, `vercel.json`.
2. **Then three parallel tracks** that never edit the same file (requirements section 10): A = event + guests, B = canvas + drag and drop, C = share + guest view + export.
3. **Drag and drop = exploration Approach A**: one `DndContext`; draggables tagged `data.type: 'guest' | 'table'`; tables need no droppable (apply `delta` via `moveTable`); seats and table bodies are droppables; `onDragEnd` switches on type; composed collision detection (`pointerWithin` then `closestCenter`); table drag handle on the centre label; `PointerSensor` with `activationConstraint: { distance: 5 }` so click/double-click coexist with drag.
4. **Share link**: write and read the lz-string payload raw in the fragment, never `encodeURIComponent` / `URLSearchParams`; QR rendered at `level="L"` only when the URL is under ~1,200 chars, otherwise copy-link plus a Spanish note.
5. **Export**: `html-to-image` with `skipFonts: true`, `pixelRatio: 2`, white background, `await document.fonts.ready`; system font stack.
6. **Assumptions**: adopt exploration section 4 items 1–13, with items 1 and 2 refined by design decision D10 (table count 1–20; canvas 1600×1200 / 5×4 grid / 290×270px pitch / 50px margin; label truncation; slate/amber/emerald occupancy; clamp `moveTable`; red ring + toast on rejection; 5px activation; `autoSeat` ignores the filter; payload holds names so unseated guests are absent from the link; duplicate matches as `(name, table, seat)` tuples; slugified export filename; shared `ConfirmDialog`; free seats = total capacity − seated).

## Team Workflow

- Base lands as one commit on `main` before anyone branches.
- Branches: `feat/track-a-event-guests`, `feat/track-b-canvas-dnd`, `feat/track-c-share-guestview-export`.
- Ownership: A `src/features/event/**`, `src/features/guests/**`; B `src/features/tables/**` (except `TableView.tsx`); C `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**`.
- Frozen (edit only with team agreement, one commit on `main`): `src/store/**`, `src/app/**`, `src/lib/**`, `src/index.css`, `vite.config.ts`, `vercel.json`, `src/features/tables/TableView.tsx`.
- Merge order into `main`: any; tracks are file-disjoint. Vercel previews per branch.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, `vite.config.ts`, `vercel.json`, `src/index.css`, `src/main.tsx` | New | Scaffold, Tailwind plugin, SPA rewrite |
| `src/app/**` | New | Router, `AppLayout`, `ConfirmDialog` |
| `src/store/**` | New | Types, 16-action store with `persist`, selectors |
| `src/lib/**` | New | Geometry, text normalization, ids |
| `src/features/event/**`, `src/features/guests/**` | New | Track A |
| `src/features/tables/**` | New | Track B (+ frozen `TableView.tsx`) |
| `src/features/share/**`, `guest-view/**`, `export/**` | New | Track C |

## Review Budget (single-pr, 800 lines)

The frozen base (scaffold + store + geometry + layout + `TableView`) will very likely exceed 800 changed lines on its own. It is delivered as one base commit under an explicit `size:exception` because it is greenfield scaffolding with no prior behaviour to regress. Tracks A, B and C are each expected to fit within 800 lines. `sdd-tasks` MUST forecast base and each track separately.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| QR overflow crashes share dialog (RF-29) | Med | Length guard before render, `level="L"` |
| Store contention across branches | Med | All 16 actions complete in the base |
| `TableView` built twice (B and C) | Med | Presentational component in the base |
| Stray `encodeURIComponent` breaks every link | Med | Code comment + explicit spec scenario |
| `html-to-image` blank first frame | Low | `fonts.ready` + documented retry |
| Track A owns RF-06/07/08/12 but their UI entry points sit near table components (B's folder) | Med | `sdd-design` assigns file-level entry points (topbar/menu owned by A vs. handlers wired by B via store actions) |
| Base exceeds review budget | High | Accepted `size:exception`; tracks stay under budget |

## Rollback Plan

- Greenfield: rollback of any track = delete its branch; rollback of the base = reset `main` to the pre-scaffold commit.
- Persisted store shape change mid-week: bump `persist.version`; `migrate` returns `{ event: null }`. Data loss is accepted for the demo.
- Share payload change: bump `v`; guest view rejects unknown `v` with the invalid-link message.

## Dependencies

- Node + npm on three Windows machines; Vercel project connected to GitHub.
- Verified packages: `@dnd-kit/core@6.3.1`, `zustand@5.0.15`, `react-router-dom@7.18.3`, `lz-string@1.5.0`, `qrcode.react@4.2.0`, `html-to-image@1.11.13`, `@tailwindcss/vite@4.3.3`.

## Success Criteria

- [ ] `npm run build` and `npx tsc --noEmit` pass on `main`.
- [ ] Manual checklist RF-01..RF-35 passes on the Vercel deploy (desktop editor, mobile guest view).
- [ ] No merge conflicts between tracks A/B/C; frozen files unchanged after base except by agreed commits.
- [ ] A 60-guest event shares via QR; a 200-guest event shares via copied link without a crash.
