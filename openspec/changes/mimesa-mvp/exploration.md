# Exploration: MiMesa MVP — technical mapping of RF-01..RF-35

Greenfield repo. Only `docs/requirements.md`, `openspec/config.yaml`, `.gitignore`, `.atl/`, and an empty `.git` exist. No `package.json`, no `src/`. Everything below is forward-looking design input for `sdd-propose` / `sdd-spec` / `sdd-design`. Product scope is closed; this document adds no features.

## 1. Spec domain partition

Eight domains, matching the orchestrator's suggestion. Every RF lands in exactly one.

| Domain | RF IDs | Depends on |
|---|---|---|
| `event` | RF-01, RF-02, RF-03, RF-04 (template *choice*) | — |
| `tables` | RF-04 (template *materialization*), RF-05..RF-13 | `event` |
| `guests` | RF-14..RF-19 | `event` |
| `seating` | RF-20..RF-26 | `tables`, `guests` |
| `persistence` | RF-27 | `event`, `tables`, `guests`, `seating` (whole model) |
| `share` | RF-28, RF-29 | whole model (read-only) |
| `guest-view` | RF-30..RF-34 | `share` (payload format is the contract) |
| `export` | RF-35 | `tables` (renders the canvas DOM node) |

Notes for `sdd-spec`:
- RF-04 is deliberately split: the *form* (choose "6 mesas de 8" / custom count+capacity) is `event`; the *effect* (N tables named "Mesa i", grid-positioned) is `tables` together with RF-05.
- `persistence` is cross-cutting; write it as one requirement about round-tripping the whole `Event` through `localStorage`, not per-entity.
- `guest-view` must not depend on `persistence`. It reads only the URL fragment.
- Track mapping stays as in requirements section 10: A = `event` + `guests`, B = `tables` + `seating`, C = `persistence` + `share` + `guest-view` + `export`.

## 2. Technical risks and recommendations (verified)

### 2.1 `@dnd-kit/core` + React 19 — LOW risk

Verified on the npm registry: `@dnd-kit/core@6.3.1`, `peerDependencies: { react: ">=16.8.0", react-dom: ">=16.8.0" }`. React 19 satisfies that range, so `npm install` needs no `--legacy-peer-deps`. `@dnd-kit/react@0.5.0` (the rewrite, peer `^18 || ^19`) is still pre-1.0 with a different API and different docs; **do not use it** — requirements section 8 names `@dnd-kit/core`. Historical StrictMode double-invoke bugs were fixed in the 6.x line (clauderic/dnd-kit PR #788); React 19 StrictMode behaves like React 18's, so those fixes apply.

**Two drag kinds in one context — the problem mostly dissolves.** Moving a table (RF-11) needs no droppable: use `useDraggable` on the table and apply `event.delta` to `x`/`y` via `moveTable`. Only guests (RF-20..RF-23) need droppables. Recommendation:

- **One `DndContext`**, mounted in the base layout so it wraps both the sidebar and the canvas (a guest must drag from sidebar to canvas — cross-context drags are not supported).
- Tag every draggable: `useDraggable({ id, data: { type: 'guest' | 'table', ... } })`. Guest data carries its origin: `{ type: 'guest', guestId, from: { tableId, seatIndex } | 'sidebar' }` — this is what makes RF-23 (reseat) and RF-22 (revert) trivial.
- Tag every droppable: `useDroppable({ id, data: { type: 'seat' | 'table', tableId, seatIndex? } })`.
- `onDragEnd` branches on `active.data.current.type` — one switch, two code paths.
- **Collision detection**: seats are small (~28px). Use a composed detector — `pointerWithin` first, falling back to `closestCenter` when it returns nothing (documented composition pattern in the dnd-kit collision-detection docs). Filter candidate droppables so a table-body drop (RF-21) only wins when no seat is under the pointer. Do **not** use the default `rectIntersection`: the docs explicitly call it demanding for small targets.

**Two gotchas that will bite otherwise:**
1. *Nested draggables.* A seat droppable holding a draggable guest sits inside a draggable table. Spread listeners bubble, so pointerdown on a guest would also start the table drag. Fix: attach the table's drag listeners to a **handle** (the centre name label), not the whole table.
2. *Click vs drag (RF-24 and RF-08 vs RF-11).* RF-24 opens a menu on click on a seated guest; RF-08 renames on double click on the table name — both targets are also drag sources. Fix: `PointerSensor` with `activationConstraint: { distance: 5 }`. A click or double click without 5px of movement never starts a drag.

### 2.2 Seat geometry — LOW risk, pure math, belongs in the frozen base

Capacity is 2–20 (requirements section 11). With seat diameter `S = 28` and a minimum arc gap of 8px, the seat-ring radius must satisfy `2πR ≥ c·36`, so:

```
R_seat(c)  = max(46, Math.ceil(36 * c / (2 * Math.PI)))   // 46 for c ≤ 8, 57 at c=10, 115 at c=20
R_table(c) = R_seat(c) - S / 2                             // table disc; seats straddle its edge
box(c)     = 2 * (R_seat(c) + S / 2)                       // 120px at c=8, 257px at c=20
angle(i,c) = -Math.PI / 2 + (2 * Math.PI * i) / c          // seat 0 at 12 o'clock, clockwise
pos(i,c)   = { x: R_seat(c) * Math.cos(angle), y: R_seat(c) * Math.sin(angle) }
```

Render each seat absolutely at `left: calc(50% + x)`, `top: calc(50% + y)`, `transform: translate(-50%, -50%)` — no SVG needed, which keeps the seats real DOM drop targets and keeps `html-to-image` happy. Grid placement for RF-05: fixed 260px pitch, 4 columns, 60px margin, on a fixed 1600×1200 scrolling canvas.

This module (`src/lib/geometry.ts`) is used by **both** track B (editor canvas) and track C (RF-32 guest table drawing), so it must exist in the frozen base.

### 2.3 `html-to-image` + Tailwind v4 oklch — LOW risk (contrary to the common warning)

The widely reported *"Attempting to parse an unsupported color function oklch"* is an **html2canvas** failure (niklasvh/html2canvas issue #3269), not an `html-to-image` one. The two libraries work differently: html2canvas parses CSS in JavaScript and reimplements painting, so it must understand `oklch()`. `html-to-image@1.11.13` instead clones the node, copies **computed** styles, serializes to XML, wraps it in `<foreignObject>` inside an SVG data URL, and lets the **browser** paint it. The browser already supports `oklch` (Chrome 111+, Firefox 113+), so Tailwind v4's default oklch palette and `@import "tailwindcss"` are never parsed by JS and never fail. Do **not** downgrade the palette to hsl and do **not** swap in `html2canvas-pro`.

The real `html-to-image` risks for RF-35 are different:
- **Fonts.** `embedWebFonts` walks `document.styleSheets` and can throw `SecurityError` on cross-origin sheets (e.g. Google Fonts via `<link>`). Recommendation: use a system font stack (Tailwind's default `font-sans`) and pass `skipFonts: true`. Zero cost, removes the whole class of failure.
- **First-call blank/partial image.** A well-known behaviour of the foreignObject approach. Recommendation: `await document.fonts.ready` before the call, and accept a second `toPng` call as the documented workaround if a blank frame appears.
- **Options to set**: `pixelRatio: 2`, `backgroundColor: '#ffffff'`, `cacheBust: true`, plus `filter` to drop drag overlays and menus from the capture.
- The README's own limitation — *"rendering will fail on huge DOM due to the dataURI limit"* — is not reachable at 20 tables.

### 2.4 `lz-string` payload size and hash reading — MEDIUM risk (the QR is the real problem)

**Size.** For 200 guests at ~14 chars each across 20 tables, the RF-28 payload (`{v,n,d,p,t:[{n,s}]}`) is ~3.9 KB of raw JSON. `compressToEncodedURIComponent` emits 6-bit-per-char URI-safe text; expect **~2.2–2.8 KB**, matching the 2–3 KB figure in requirements section 5. Total URL ≈ 2.9 KB — far below every desktop and mobile browser limit. No risk.

**QR (RF-29) is the risk.** A QR code maxes out at **2,953 bytes** in byte mode at error-correction level L (version 40, 177×177 modules). A 200-guest link sits *at or past* that ceiling, and `qrcode.react@4.2.0` throws synchronously during render on overflow, which would crash the share dialog. Even a link that fits produces a version-40 code that needs ~350px on screen to scan reliably from a phone. Recommendation: render the QR with `level="L"`, and **guard by length** — if the URL exceeds ~1,200 characters, render the copy-link button plus a Spanish note instead of the QR, rather than letting it throw. This keeps RF-29 satisfied for realistic demo events (~60 guests) without a crash path.

**Hash reading — one exact gotcha.** Verified in `lz-string@1.5.0`: `keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$"`, and `decompressFromEncodedURIComponent` begins with `input = input.replace(/ /g, "+")`. So the payload contains `+` and `$`. Both are legal in a URI fragment, so the rule is:

- **Write** the payload raw: `` const url = `${location.origin}/invitado#${payload}` ``. Never `encodeURIComponent` it — that turns `+` into `%2B` and breaks decompression.
- **Read** it raw: `location.hash.slice(1)`, or React Router's `useLocation().hash.slice(1)`. Never `decodeURIComponent` it.
- Never route the payload through `URLSearchParams` or a query string — that is exactly where `+` becomes a space (and why lz-string defends against it).
- The fragment never reaches Vercel, which is the point of RF-28.

### 2.5 Zustand `persist` store shape — LOW risk

`zustand@5.0.15`, peer `react >= 18`. Recommended shape — a single store, all 18 contract actions from requirements section 7 implemented in the base:

```ts
type EventState = { event: Event | null } & EventActions;

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({ event: null, /* all 18 actions */ }),
    {
      name: 'mimesa-event',
      version: 1,
      partialize: (s) => ({ event: s.event }),
      migrate: (persisted, version) => (version === 1 ? persisted as { event: Event | null } : { event: null }),
    },
  ),
);
```

- `Table.seats: (string | null)[]` is the right model here precisely because `null` survives `JSON.stringify` unchanged. No custom `storage` serializer is needed. A `Map` or `Set` would have forced one — keep arrays.
- `partialize` exists so transient UI state (`selectedTableId`, open dialogs, search text) can be added later to the store without leaking into `localStorage`. Better: keep transient UI in component state and never in the store.
- `localStorage` is synchronous, so hydration happens before first paint — no hydration flash and no need for `onRehydrateStorage` / `hasHydrated`.
- If the shape changes mid-week, bump `version` and let `migrate` return a fresh `{ event: null }`. Data loss is acceptable for a 5-day demo and must be stated in the proposal's rollback plan.
- **Rule for track C**: `/invitado` must not read this store. It reads only the fragment. Importing the store module on that route would hydrate the *visitor's* own localStorage, which is not the shared event.

### 2.6 Vercel static deploy — LOW risk

`vercel.json` at the repo root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Do not set `cleanUrls: true` — with it the destination must be `/` instead of `/index.html`, which is an easy way to break the deploy for no benefit. Vercel auto-detects Vite (`npm run build` → `dist`). The `#fragment` is client-side only and is unaffected by the rewrite; the rewrite exists solely so a cold load of `/invitado` returns `index.html` instead of a 404.

### 2.7 Package manager — `npm`

Recommended, no reservations. It ships with Node (nothing to install on three Windows machines), `package-lock.json` is deterministic, and Vercel detects it with zero configuration. pnpm is faster but adds a global install step, Windows store/symlink quirks, and a Vercel install-command setting — none of which pays for itself in five days.

## 3. Scaffold sequence for the frozen common base

Run once, together, on `main`, before anyone branches. Commands are PowerShell-safe.

```powershell
cd C:\Users\Marco\Desktop\MiMesa
npm create vite@latest .          # template: React, variant: TypeScript
npm install
npm install @tailwindcss/vite tailwindcss
npm install zustand @dnd-kit/core react-router-dom lz-string qrcode.react html-to-image
```

**Gotcha:** the directory is not empty (`docs/`, `openspec/`, `.git/`, `.gitignore`, `.atl/`). `npm create vite@latest .` will prompt — choose **"Ignore files and continue"**, never "Remove existing files". Verified versions: `@tailwindcss/vite@4.3.3` (peer `vite ^5.2 || ^6 || ^7 || ^8`), `react-router-dom@7.18.3` (peer `react >= 18`), `qrcode.react@4.2.0` (peer includes `^19.0.0`), `html-to-image@1.11.13`, `@dnd-kit/core@6.3.1`.

Then, in the same base commit:

| File | Content | Owner after base |
|---|---|---|
| `vite.config.ts` | add `tailwindcss()` to `plugins` | frozen |
| `src/index.css` | `@import "tailwindcss";` | frozen |
| `src/main.tsx` | `<RouterProvider router={router} />` | frozen |
| `src/app/router.tsx` | `createBrowserRouter`: `/` → `EditorPage`, `/invitado` → `GuestViewPage` | frozen |
| `src/app/AppLayout.tsx` | shell: `<Topbar/>`, `<GuestSidebar/>`, `<CanvasArea/>` inside `<DndProvider>` | frozen |
| `src/app/ConfirmDialog.tsx` | shared confirm (RF-03, RF-06, RF-13, RF-17 all need it) | frozen |
| `src/store/types.ts` | `Guest`, `Table`, `Event`, `TableTemplate`, `SharePayload` | frozen |
| `src/store/useEventStore.ts` | **all 18 actions fully implemented** + `persist` | frozen |
| `src/store/selectors.ts` | counters (RF-19), unseated list | frozen |
| `src/lib/geometry.ts` | `seatRadius`, `seatPositions`, `gridLayout` | frozen |
| `src/lib/text.ts` | accent/case-insensitive normalize (RF-18, RF-31) | frozen |
| `src/lib/ids.ts` | `crypto.randomUUID()` wrapper | frozen |
| `src/features/tables/TableView.tsx` | **presentational** round table: props `{ name, seatNames, capacity, highlightSeatIndex? }` | frozen |
| `src/features/tables/DndProvider.tsx` | `DndContext` + sensors + collision detection + `onDragEnd` stub | track B |
| `src/features/*/index.tsx` | placeholder components so both routes compile | per track |
| `vercel.json` | SPA rewrite | frozen |

**The two decisions that make parallel work actually parallel:**
1. **The store is complete in the base, not stubbed.** If track A implements `addGuests` and track B implements `moveTable` on their own branches, they conflict in `useEventStore.ts` on every merge. All 18 actions land in the base commit; branches add components only.
2. **`TableView.tsx` is presentational and lives in the base.** Track B (RF-09/RF-10, wraps it with drag) and track C (RF-32, renders it read-only with one seat highlighted) both need the same drawing. Building it twice is the single largest duplication risk in this plan.

File ownership after branching — no two tracks touch the same file:
- **A**: `src/features/event/**`, `src/features/guests/**`
- **B**: `src/features/tables/**`
- **C**: `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**`
- **Frozen** (changes require team agreement): `src/store/**`, `src/app/**`, `src/lib/**`, `src/index.css`, `vite.config.ts`, `vercel.json`, `src/features/tables/TableView.tsx`

## 4. Ambiguities in `docs/requirements.md` and recorded assumptions

No question is raised to the user; each resolution below is an assumption for `sdd-design` to adopt.

1. **RF-04 custom bounds.** Table count is unbounded in the doc. Assume 1–30 tables; capacity 2–20 (section 11 gives capacity). Validate in the creation form.
2. **RF-05 canvas size.** Section 11 says "tamaño fijo con scroll" without dimensions. Assume 1600×1200px, 4-column grid, 260px pitch, 60px margin.
3. **RF-09 centre label at capacity 20.** The disc is 200px across but the label competes with 20 seats. Assume name truncation with a `title` tooltip, occupancy `5/8` on a second line.
4. **RF-10 occupancy colours** are unspecified. Assume empty = slate, partial = amber, full = emerald (Tailwind default palette), fixed in `design.md`.
5. **RF-11 bounds.** Assume `moveTable` clamps `x`/`y` to the canvas rectangle. Do **not** add `@dnd-kit/modifiers` for `restrictToParentElement` — it is not in the section 8 stack, and clamping in the action is three lines.
6. **RF-22 rejection signal** is unspecified. Assume a red ring on the invalid seat/table during `dragOver` plus a brief toast. dnd-kit already returns the item to origin when no valid drop occurs, so no explicit revert logic is needed.
7. **RF-23 + RF-24 coexistence.** Assume `PointerSensor` with `activationConstraint: { distance: 5 }` so click-to-menu (RF-24) and drag-to-reseat (RF-23) share the same element. Same mechanism resolves RF-08 double-click-rename versus RF-11 table drag.
8. **RF-26 ordering under an active filter.** Assume `autoSeat()` always uses the full unseated list in insertion order and ignores the RF-18 search box.
9. **RF-28 payload holds names, not ids** (per the section 7 example). Consequence: **unseated guests do not appear in the share link**, so a loaded-but-unseated guest hits the RF-33 "no encontramos tu nombre" message. Assume this is intended and keep the payload minimal per `config.yaml`.
10. **RF-31/RF-32 duplicate names.** Assume matches are listed as `(name, tableName, seatIndex)` tuples and the chosen tuple carries the exact seat to highlight, so RF-32's highlight is unambiguous.
11. **RF-35 filename.** Assume the event name is slugified (lowercase, accents stripped, non-alphanumerics → `-`) before `plano-<slug>.png`.
12. **RF-03 / RF-13 confirmation UI** is unspecified. Assume the shared `ConfirmDialog` from the base, not `window.confirm`, since four requirements need it.
13. **RF-19 "sillas libres"** = `sum(table.capacity) - seatedCount`.

## 5. Approaches compared (drag-and-drop architecture — the only real fork)

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| **A. One `DndContext`, discriminate on `active.data.current.type`** | Sidebar→canvas drags work (cross-context is impossible); one `onDragEnd`; tables need no droppable at all, just `delta` | Requires a composed collision detector and a table drag handle to avoid nested-draggable bubbling | Low |
| B. Two nested `DndContext`s (guests / tables) | Clean separation of concerns | Nested contexts intercept each other's sensors; still one provider must span sidebar and canvas; more wiring for zero gain | Medium |
| C. dnd-kit for guests, raw pointer events for table moving | Fully independent drag kinds | Two drag idioms, two sets of bugs, manual pointer capture, manual touch handling | Medium |

**Recommendation: Approach A.** Requirements section 8 already commits to "una sola librería"; A is the only option that honours that without fighting the library. The nested-draggable and click-versus-drag hazards both have one-line fixes (drag handle on the table label, `activationConstraint: { distance: 5 }`), and table movement needs no droppable, which removes most of the perceived complexity.

## 6. Risks summary

- **RF-29 QR overflow** — a large event produces a URL past the 2,953-byte QR ceiling and `qrcode.react` throws during render. Mitigated by a length guard, not by a try/catch after the fact. *Highest-severity finding.*
- **Store contention** — if `useEventStore.ts` is not complete before branching, all three tracks conflict on it repeatedly.
- **`TableView` duplication** — tracks B and C both need the round-table drawing; it must be presentational and in the base.
- **`html-to-image` first-call blank frame** — needs `document.fonts.ready` and a documented retry; do not discover this on demo day.
- **Payload encoding** — a stray `encodeURIComponent` around the lz-string output silently breaks every share link. Worth an explicit comment in the code.
- **Schedule** — 5 days, 3 people, no tests. The 800-line single-PR budget will be tight; `sdd-tasks` should forecast base + three tracks separately.

## 7. Ready for proposal

**Yes.** Domain partition, dependency order, base file inventory, ownership map, and 13 recorded assumptions are ready for `sdd-propose` and `sdd-spec`. No product question is open.
